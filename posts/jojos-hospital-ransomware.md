## Introduction

This is basically the walkthrough of detection of a ransomware incident occurred at JoJo's hospital — not a real incident but a lab available on KC7.

**Initial Details:**
> JoJo's Hospital in Lexington, Kentucky, recently faced a serious cyberattack that locked their important files. The hackers sent a message to the hospital asking for money to unlock the files. They gave a specific amount of time to pay.

From the initial description we find that JoJo's hospital has recently faced a cyberattack and the attacker have encrypted all the files and are basically demanding for a ransom for unlocking the file. They have even attached a video where they also mention the consequences if they do not comply to their demands.

![](attachment_jojos-hospital-ransomware/Pasted_image_20260409160804.png)

They also left a note:

![](attachment_jojos-hospital-ransomware/Pasted_image_20260409160918.png)

Here they have named themselves as **Lock Byte**.

---

## Initial Analysis

Since the attackers mentioned encryption, let us suppose the hospital is maintaining a SIEM — which in this case JoJo's hospital was. So let's see what the SIEM tells us.

We can use the following query:

```kusto
FileCreationEvents
| where filename endswith ".encrypted"
| take 10
```

Here we are checking the `FileCreationEvents` table for any files ending with `.encrypted` and by using `take 10` we are just taking the first ten entries.

![](attachment_jojos-hospital-ransomware/Pasted_image_20260409161427.png)

> I will be using **KQL (Kusto Query Language)** throughout the investigation as this is Microsoft's SIEM solution. Unlike Splunk which utilizes SPL, Azure Sentinel uses KQL. You can configure it using Sentinel advanced threat hunting and install Agents on the designated endpoints.

In order to know how bad this could be, we will use `count` to list the number of encrypted files:

![](attachment_jojos-hospital-ransomware/Pasted_image_20260409161812.png)

The file count is pretty high. Before we investigate how the attacker got in, let's find out how many endpoints have been compromised — we'll get the distinct hostnames from the table:

![](attachment_jojos-hospital-ransomware/Pasted_image_20260409162450.png)

---

## Finding the Ransomware Note Hash

We need to find the SHA256 hash of the `We_Have_Your_Data_Pay_Up.txt` file. Since a file would have been created, we'll check the file creation events and look up the filename:

![](attachment_jojos-hospital-ransomware/Pasted_image_20260409162627.png)

The hash is:
```
97c348e95c8a8aeb8808f76434d73a92bbcb6b4586788365762b22624990b018
```

We also find other useful info: the hostname and path where it was created — this could be really helpful in further investigation.

Now let us see if this file was present on other systems as well:

![](attachment_jojos-hospital-ransomware/Pasted_image_20260409163348.png)

Interesting — this file is only present on one hostname: **`AMFB-MACHINE`**.

---

## Listing Available Log Tables

Now since we have the name of the machine, we need to investigate the process of how the system could have been infected. First, let's list all available tables:

```kusto
.show tables
```

![](attachment_jojos-hospital-ransomware/Pasted_image_20260409163702.png)

We should begin our investigation with the **Employees** table to find the employee who was targeted for initial access:

![](attachment_jojos-hospital-ransomware/Pasted_image_20260409164102.png)

Now we have the employee's name and IP address to continue the investigation.

---

## Investigating Process Events

From the company employee data, we find the initial breach occurred around `2024-06-17` and `2024-06-18`. Let us check the process events for this host during that time frame:

```kusto
ProcessEvents
| where hostname == "AMFB-MACHINE"
| where timestamp between (datetime(2024-06-17) .. datetime(2024-06-18))
```

The syntax for checking logs between a time frame is:
`timestamp between (datetime(Initial_Date) .. datetime(Final_Date))`

![](attachment_jojos-hospital-ransomware/Pasted_image_20260409164742.png)

We have 14 processes running between that time period. Let's investigate them — if we check the `process_commandline` we find a suspicious process named **"spread ransomware"**:

![](attachment_jojos-hospital-ransomware/Pasted_image_20260410000415.png)

![](attachment_jojos-hospital-ransomware/Pasted_image_20260410000653.png)

There are other suspicious processes as well:

```
C:\Users\andavis\Downloads\patient_data_exporter.exe /export C:\Users\andavis\Documents\patient_data_1.zip /source \\jojos-hospital-server\important_data\patient_records
```

Analysing the file shares, we see important patient records are being stored as zip files and later uploaded to `secure-health-access.com`. The attacker is also trying to cover tracks by deleting the zip file:

![](attachment_jojos-hospital-ransomware/Pasted_image_20260410001619.png)

---

## Pivoting to the Malicious Domain

Now we have a strong lead: the domain `secure-health-access.com`. Let's check Passive DNS:

```kusto
PassiveDNS
| where domain == "secure-health-access.com"
```

We find two IP addresses associated with the domain:

![](attachment_jojos-hospital-ransomware/Pasted_image_20260410003302.png)

Now let's pivot to these IPs and check if there are other domains associated:

![](attachment_jojos-hospital-ransomware/Pasted_image_20260410003702.png)

We initialize an array with `dynamic()`, place the found IP addresses, and match them in the PassiveDNS table. We find an additional domain: **`emr-help.net`**.

Now let's check how many requests these attacker IPs made to our systems:

![](attachment_jojos-hospital-ransomware/Pasted_image_20260410004344.png)

![](attachment_jojos-hospital-ransomware/Pasted_image_20260410004504.png)

**37 requests** — that's a lot. Let's check what those requests look like:

![](attachment_jojos-hospital-ransomware/Pasted_image_20260410004645.png)

The attacker was trying to enumerate resources and gain access wherever possible. Including timestamps gives us an idea of when enumeration was happening:

![](attachment_jojos-hospital-ransomware/Pasted_image_20260410004915.png)

---

## Checking Authentication Logs

Now let's check if the attacker actually gained access via these enumeration attempts:

![](attachment_jojos-hospital-ransomware/Pasted_image_20260410005127.png)

We have a log from the malicious IP:

![](attachment_jojos-hospital-ransomware/Pasted_image_20260410005240.png)

**Username: `andavis`** — and the IP the threat actor used is external.

![](attachment_jojos-hospital-ransomware/Pasted_image_20260410005402.png)

Checking the Employees table for this username confirms a different IP is associated (the real employee's internal IP), confirming an external threat actor logged in using a stolen credential. The employee is **Anthony Davis**.

---

## Part 2 — Phishing & Lateral Movement

Now we know Anthony Davis's account is related to the attack. One important new piece of information:

![](attachment_jojos-hospital-ransomware/Pasted_image_20260410172955.png)

**Raising Cane's** (the fast food chain) is mentioned as popular among hospital employees, and some employees mentioned a fake sponsored page — `raisinkanes.com` — trying to impersonate the real `raisingcanes.com`. The title in the sponsored domain also mismatches its URL.

Let's investigate how many users accessed the fake domain by checking `OutboundNetworkEvents`:

![](attachment_jojos-hospital-ransomware/Pasted_image_20260410173629.png)

Around **26 requests**:

![](attachment_jojos-hospital-ransomware/Pasted_image_20260410173713.png)

Requests came from **24 different IP addresses** — very bad. We need to check if any credentials were submitted. When users clicked the URL, they were redirected to:

![](attachment_jojos-hospital-ransomware/Pasted_image_20260410174105.png)

They were redirected to **`nothing-to-see-here.net`**. In the URL logs, we also find another domain: **`totally-legit-domain.com`**.

---

## Malicious File Downloads

Let's check for any files downloaded from the phishing site:

![](attachment_jojos-hospital-ransomware/Pasted_image_20260410174349.png)

Checking for common file types — we find a hit for a `.docx` file:
**`Raisin_Kane_Promo_Offer.docx`**

We also find a PDF:

![](attachment_jojos-hospital-ransomware/Pasted_image_20260410174557.png)

**`Raisin_Kane_Free_Meal_Voucher.pdf`**

Now let's check how many users actually downloaded and ran the file:

![](attachment_jojos-hospital-ransomware/Pasted_image_20260410174713.png)

**23 out of 24** who reached the site clicked it 😬

The first user clicked at an earlier timeline:

![](attachment_jojos-hospital-ransomware/Pasted_image_20260410174836.png)

Let's pivot our investigation to this particular user. The key hostname is: **`RQJQ-MACHINE`**.

We can further get the file hash and check it on threat intel platforms like VirusTotal or ANY.RUN:

![](attachment_jojos-hospital-ransomware/Pasted_image_20260410175108.png)

Looking at the top two logs for this machine — just after the file was downloaded, another file appears: **`cobalt-strike`**.

> **Cobalt Strike** is a commercial penetration testing and red team tool used to simulate real cyberattacks. Its presence here is a huge red flag.

---

## Tracing Cobalt Strike Execution

Let's focus on this particular timeline and check what commands were running after the docx download. We use the ProcessEvents table for the interval `2024-05-01` to `2024-05-02`:

![](attachment_jojos-hospital-ransomware/Pasted_image_20260410175911.png)

Narrowing down to the specific file:

```kusto
ProcessEvents
| where hostname == "RQJQ-MACHINE"
| where timestamp between (datetime(2024-05-01) .. datetime(2024-05-02))
| project process_commandline
| where process_commandline contains "Raisin"
```

![](attachment_jojos-hospital-ransomware/Pasted_image_20260410180037.png)

**The file was executed.** And after execution, Cobalt Strike was also launched:

![](attachment_jojos-hospital-ransomware/Pasted_image_20260410180334.png)

We now have the **C2 IP and port**: `93.238.22.122:50050`

Looking at a wider time frame (`2024-05-02` to `2024-05-04`), we see enumeration commands:

![](attachment_jojos-hospital-ransomware/Pasted_image_20260410180924.png)

---

## Pivoting to the High-Value Target: Anthony Davis

Anthony Davis was a high-position employee whose account the threat actor was very interested in. Let's find his hostname:

![](attachment_jojos-hospital-ransomware/Pasted_image_20260410181408.png)

Since Cobalt Strike was present on the other machine, let's check if the attacker also tried to exfiltrate data from this user's machine:

![](attachment_jojos-hospital-ransomware/Pasted_image_20260410181645.png)

**Data was also exfiltrated from his account.** Since this was a high-privilege account, the attacker could also try to access other resources accessible to this user.

Moving the timeframe forward and running:

```kusto
ProcessEvents
| where hostname == "AMFB-MACHINE"
| where timestamp between (datetime(2024-05-13) .. datetime(2024-05-17))
| project process_commandline
```

![](attachment_jojos-hospital-ransomware/Pasted_image_20260410181949.png)

The attacker ran `advanced-ip-scanner.exe` — likely to map out the hospital's network infrastructure.

---

## Data Exfiltration & Cleanup

The attacker copied `network_diagrams` and credentials from network shares and stored them as a local file:

![](attachment_jojos-hospital-ransomware/Pasted_image_20260410190337.png)

Then compressed them into a zip before exfiltrating:

![](attachment_jojos-hospital-ransomware/Pasted_image_20260410190501.png)

Finally, the attacker exfiltrated the zip to: **`https://nothing-to-see-here.net/upload`**

---

## Conclusion

This was the complete attack scenario for the JoJo's Hospital KC7 lab. To summarize the attack chain:

1. **Initial Phishing** → Fake Raising Cane's sponsored page lured employees
2. **Malicious File Delivery** → `Raisin_Kane_Promo_Offer.docx` dropped Cobalt Strike
3. **C2 Establishment** → Cobalt Strike beacon to `93.238.22.122:50050`
4. **Credential Theft** → Anthony Davis's credentials compromised
5. **Enumeration** → Network scanning with `advanced-ip-scanner.exe`
6. **Data Exfiltration** → Patient records & network diagrams stolen, uploaded to `nothing-to-see-here.net`
7. **Ransomware Deployment** → Files encrypted with `.encrypted` extension by LockByte

> I will be posting a **MITRE ATT&CK Mapping** for this lab as well in the near future (Part 2).

Thank you very much for reading! 🙏
