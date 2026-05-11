# AWS Raid

## Scenario
Your organization utilizes AWS to host critical data and applications. An incident has been reported that involves unauthorized access to data and potential exfiltration. The security team has detected unusual activities and needs to investigate the incident to determine the scope of the attack.

This is an AWS-based lab focused on data exfiltration and persistence mechanism forensics (available on Cyberdefenders).
I quite enjoyed solving this, as I am not very familiar with cloud forensics, so this was actually a very good start.
Link=https://cyberdefenders.org/blueteam-ctf-challenges/awsraid/

**1. Knowing which user account was compromised is essential for understanding the attacker's initial entry point into the environment. What is the username of the compromised user?**

Final query for checking the failed logons:
It took me some time to put this together.
Firstly, I had to check the indexes to see what logs I had.
From the given scenario, there was unauthorized access.
Let us begin by searching for the failed logins.
So we are checking for the eventName=consoleLogin and the source is signin.amazonaws.com.
You will not always remember this; refer to this guide for the event list:
https://gist.github.com/pkazi/8b5a1374771f6efa5d55b92d8835718c

```splunk
index="aws_cloudtrail" eventName="consoleLogin" eventSource="signin.amazonaws.com" "responseElements.ConsoleLogin"="Failure"
| stats count by userIdentity.userName
| table userIdentity.userName, count
```
![](attachment/Pasted%20image%2020260511111751.png)

This is a highly unusual number of failed logins within a very short period of time, so this could possibly be the compromised account.

The last login timeline must be studied in order to maintain the timeline of events.
![](attachment/Pasted%20image%2020260511112131.png)

The time was:
11/2/23 9:54:00.000 AM

Now we must focus our analysis on this timeline. During this period, around 9 failed login attempts took place, after which the attacker likely gained access to the account and performed malicious operations.
Near this timeline, there was nothing particularly interesting. The attacker just checked the price forecast using API calls, and there were some other API calls to health.aws.com, which may just have been the IT person, Luke.

![](attachment/Pasted%20image%2020260511113216.png)

So before coming to any conclusion, we will investigate the logs further.
Nothing particularly interesting here, either.
Now we will check if any S3 buckets were accessed.

**2. We must investigate the events following the initial compromise to understand the attacker's motives. What is the timestamp for the first access to an S3 object by the attacker?**

`index="aws_cloudtrail"   "userIdentity.userName"="helpdesk.luke" eventSource="s3.amazonaws.com"`

![](attachment/Pasted%20image%2020260511113956.png)

Just after the attacker accessed the account, there is basically a list buckets API call.
The timestamp is:
11/2/23 <br>9:55:09.000 AM

**3. Among the S3 buckets accessed by the attacker, one contains a DWG file. What is the name of this bucket?**

Since we know that a DWG file is present in one of the S3 buckets, we can use Splunk queries to find it.
`index="aws_cloudtrail"   "userIdentity.userName"="helpdesk.luke" eventSource="s3.amazonaws.com" "*.dwg"`
We can use this query to list all the dwg files on the S3 buckets:
![](attachment/Pasted%20image%2020260511114439.png)

Bucket name:
     bucketName: product-designs-repository31183937
We can get this by expanding the requestParameters.

**4. We've identified changes to a bucket's configuration that allowed public access, a significant security concern. What is the name of this particular S3 bucket?**

Now that we know the bucket's configuration was modified, we need to draft a query to check the API calls.
`index="aws_cloudtrail"   "userIdentity.userName"="helpdesk.luke" eventSource="s3.amazonaws.com" eventName="PutBucket*"`
I also do not remember these names, so here is a quick reference for recalling them:
https://gist.github.com/pkazi/8b5a1374771f6efa5d55b92d8835718c

Here, the access permissions are being changed for the S3 bucket.

![](attachment/Pasted%20image%2020260511115036.png)
bucketName: backup-and-restore98825501

**5. Creating a new user account is a common tactic attackers use to establish persistence in a compromised environment. What is the username of the account created by the attacker?**

`index="aws_cloudtrail"   "userIdentity.userName"="helpdesk.luke" "CreateUser"`

This basically checks for new accounts created by the user Luke. 
Another approach, if we had multiple results, would be to use the attacker's IP address (which we already knew) to highlight the particular entry we need to investigate.
![](attachment/Pasted%20image%2020260511134530.png)
![](attachment/Pasted%20image%2020260511134554.png)

**6. Following account creation, the attacker added the account to a specific group. What is the name of the group to which the account was added?**

Since the attacker created a new account, they probably wanted to add it to a group in order to gain the necessary permissions to perform their required tasks.
As for these particular keywords, I do not think anyone can remember all of them, so remember that Google is your best friend and refer to the AWS documentation for this.
AI sometimes tends to overcomplicate tasks, so keep that in mind.

The query which we can use is:
```splunk
index="aws_cloudtrail"   "userIdentity.userName"="helpdesk.luke" "AddUserToGroup"
```

![](attachment/Pasted%20image%2020260511134854.png)

Thank You for reading. Stay Tuned for future writeups and blogs.
