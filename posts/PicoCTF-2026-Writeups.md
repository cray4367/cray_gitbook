These are my writeups for the picoCTF forensics challenge. Even though I did not attempt other categories due to college exams, the forensics challenges were really fun. This time unlike a lot of categories the focus mostly was towards disk forensics and git basically unlike last year's memory forensics and bitlocker challenges(these were really my favourite, took a lot of time to solve but still worth it ). Last time also I solved all forensics challenges including some others with my team but this time was participating solo .
So without wasting much of a time let's start with the writeups

## Forensic-Git 0
This is the first challenge we will be walking through
So let's first focus on the attached artifacts ![](attachment/212c99e3e88d451889337f8f89a5f571.png)
We see a disk image attached and a hint 
So let' s begin analysing the file
![](attachment/01716c654f8217250d03bd8a492acef9.png)
We are basically having a disk.img.gz now let's extract it using gunzip
Now you are having a .img file we can basically a tool like autopsy to open this image and then extract the contents 

Another approach which i commonly use while i have these file is basically i directly use 7zip-gui directly to extract and it works just as well
I usually use extract to subdirectory but everything is fine here
![](attachment/1374cf0141f6fc7eaee1a031fcc3a3c0.png)
Now the next step is basically analyzing the extracted image
Now we are basically having three different image files
![](attachment/02d50edaff47572640ce87620d57f273.png)
I believe these all are representing different partitions so let's try extracting them using the same method
Now on analysis we find that 2.img yields us a linux filesystem, now let's examine this 
![](attachment/efd882ad9d0e809ae3856171fc0c116e.png)
![](attachment/f3053eb8dd1e83fdf16419ce608a57a1.png) 
Here in home directory of a user we find some file name note.txt which does not yield any significant information but the mvp here is basically master means git :) . Also the challenge is something related to git so let's check git logs for any important information.
```
git log
```
Here we have our flag 
![](attachment/103f0496e5372419701a10ae697a740e.png)
Flag:picoCTF{g17_1n_7h3_d15k_041217d8}

## Forensic-Git 1
Maybe this is another level of a challenge like this only 
I will not be wasting much time on this as the whole steps are same as the previous
Now simply head over to the same directory after extracting 2.img from the subfile
![](attachment/0c12506e37f025525c0dbde5b3a168e9.png)
We do not have a file here so we need to check logs first
![](attachment/a3aba5bb86d456f559a4eac323fcf157.png)
Here we are basically having two logs one is add flag and one is remove flag since we want the flag so we can basically checkout this using git checkout --id-- of the commit
```
git checkout 177789af0b300e043ea8f54ea57d6cee352291ae                                                                                 
```
![](attachment/528113b7438c3f094e5fdcbc13dc7000.png)I am basically hiding the flag in order to encourage new players not just reading but also solving alongside
## Forensics Git 2
This is the third challenge for the git category let us check what are the artifcats provided and what can we achieve from that
![](attachment/3dc2188e5da439da1a137a169ca09459.png)
This looks like a interesting git challenge
One important thing is that 
`In Git, deleting a branch or resetting a commit **does not delete the objects from the database**. It only deletes the _pointers_ (references) to those commits. The commit, the tree, and the blob containing the flag are still sitting perfectly intact inside .git/objects.`
Since we are said the attacker was interrupted in the process of disk deletion.
Here some important things to note are that the attacker basically deleted the commits![](attachment/b9439aa16e347fde60c8ab8d1375599b.png)
We also find these files which may be interesting to a certain extent but this is just for deceiving from original path
Since we already had a hint of deletion we will be checking the snapshots that git makes
Now we will check for orphaned data using the following command
```
git fsck --lost-found
```
![](attachment/90bd3d658a5d3e1361b7a983174de10b.png)
Here we have something interesting a commit this can help us recreate the timeline of the events and get the data we are basically requiring
Just use 
╰─$ git log -p 01533f718556a0e59f1467dae4fa462eed82c2a1
Here we obtain a lot of information which is not particulary useful to us but within these commits we also have a interesting thing
![](attachment/c86f4651e04b6675d3129fca1c21b58d.png)
Here we basically have our flag

## Disko 4
![](attachment/32e485ac29276755b918b9e436da706e.png)
Here basically we are given information that basically the flag was deleted from disk image
So we can take the approach of sleuthkit but we will basically be utlizing sleuthkit as it is a easier (GUI) way to use sleuthkit and it is a quite powerful tool.
For this head over to your windows vm 
If you do not want to login to picoCTF on windows
```
Invoke-WebRequest -Uri
https://challenge-files.picoctf.net/c_plain_mesa/-----/disko-4.dd.gz -Outfile "disko4.gz"
```
Replace this url obtained by copy link while right clicking on here
Now simply use 7z to extract the gz file and then head over to autopsy for our next analysis steps
In autopsy just head over to New case
Just choose a base directory and choose any case number of your choice
![](attachment/94f10446b67f27b19914a59f7fa1782f.png)
Then click on next and then finish
After the intial configuration just head over to the Add data source option and choose Disk Image or VM file
![](attachment/e0c97d3ed41ea0dd52a2492e4df71873.png)
Now just select the image you obtained after extracting the gz file
Now click on continue then next until you get finish, once you get finish just press finish
![](attachment/d145a245470aa393cac625e6f1b24624.png)
Now just click on deleted files
Now just export these two files
For the messages we do not find anything, for the gz file we can first try extracting it 
After extracting the file we basically obtain a file type file change its extension to txt and open it in notepad you basically have you flag now :)
![](attachment/d11bd1d844e9104577b79e634e84e8c6.png)
## Binary Digits
![](attachment/234328450b09686640502c24897a61e0.png)

For this file as the challenge name and description suggest we basically have a lot of 1's and 0's
![](attachment/1f0fec3c8966b366dab374af155e0471.png)
Now without wasting much time we can directly head over to cyberchef
If we combine two recipies ![](attachment/be39277ea529154aab1d17fb52091270.png)
We can basically get our flag
![](attachment/2fac0461be91e435d9cdb1f26f5aa0df.png)
Now we basically have our flag
## Rogue Tower
The challenge hints were a bit too revealing for this challenge
![](attachment/83b327776fa5951e9358efec2c8986ce.png)
This is basically a pcap analysis based challenge
So at starting we have been provided that a rogue device point in the pcap file 
First of all for checking the analysis we will need either a gui or a cli based network monitoring tool here
Since the no of packets are very less to analyse and used for exfilteration so i believe wireshark would be sufficient for that
If we check the protocol hierarchy ![](attachment/830c5ccf8eaa658286e50bb9e29c817b.png)
Here we have dns packets and http packets 
Here probably juicy stuff we are looking for is HTTP packets
Now let's have a look at the endpoints ![](attachment/09054e0965d15845c475b2f05e34afb9.png)
here the endpoints of high transfer of data could be important for us
This seems to be like the case of dns poisoning 
![](attachment/92824e814b5d7acdfa39b0624a45cd63.png)
This potentially look suspicious 
![](attachment/bb98bc13a3a19d033a4cb0842f5ca6d9.png)
Now let' s check the the body of the web request
There is basically a endoded text in the body of these post request
![](attachment/ccbbdf2c28b1f6593e2fbfe1898b311f.png)
Since we have only 6 packets we can do it manually or else we could automate this using wireshark or scapy
The text becomes
RlFXXnJldE1ECFNEAm5RBVpUa0UBRgFEaV4EBwlQUAUCRQ==
This potentially looks like base64 text
But this is not it 
Firstly i thought what is this so i tried looking for hints on picoCTF site
``
```
IMP: The encryption key is derived from the victim device's IMSI
```
Now check the IMSI of the rogue point
![](attachment/92ac8f0d026b5a75aef536057e6b9af5.png)
Now for decoding this text we have to base64 decode the text and then xor with second half of imsi
![](attachment/7e4a4832fff4d7ffc5e6f3e56a7bce8e.png)
Now we have successfully solved this challenge.
## Timline 0
![](attachment/1f3d94746a9ef1ffd1f8ff443431be13.png)
This is also a disk forensics challenge. The challenge hints states about sleuthkit but i will be utilizing autopsy on windows for this too
The initial setup is exactly same like Disko 4 discussed above just add another file using add source we can receive the current image using the left bar
For downloading this  i used Invoke-Webrequest same as the instructions above
Similarly extract the gz file using 7zip
Now we can add this file into autopsy for further analysis

From the challenge name and description we can get a hint that the challenge would be basically based on Timeline of the creation of files or events which we monitor 

Now select our data source and basically click on timline ![](attachment/5d891a8561d876a6fff177b68ad67c01.png)
Now let us look at the timeline of the events
![](attachment/c0078253cdc629193fb963013589310e.png)
Now let us check the event that occured in 1985 this looks really harmful
This is potentially effect of a technique called as timestomping here basically the time-frame chose by the attacker is really awkward may be not so sophisticated attacker.
So let's begin by analysing the file
Change the dates according to the timelines you require
![](attachment/bde7ce9c4b79e07fb9da293bff63c20c.png)
Click on the only file you see there
![](attachment/b0a0a759030fe664f115eb41ed57bdb3.png)
Check the extracted text at the bottom doesn't that look familiar
Let 's base64 decode this text 
![](attachment/87d59b9d4c5ba9987a1ed0c507b037a9.png)

Flag:picoCTF{Output}

## Timeline 1
This is the last challenge for the forensics category and also the last challenge that I tried during the picoCTF 2026 due to other commitments will be trying rev and specially the new blockchain in the near future.
![](attachment/e63dcf1bb9919046a94230fbe340aabf.png)
In the same way download the image
Now for this challenge also we are required to basically check the timeline of the file system actions

One important thing is the emphasis a anti-forensic action this could be deletion of files or basically deletion of some logs, let us investigate into this challenge and bascially get a more detailed insight into the challenge and approach to solving

For this also we are basically using autopsy and generating a timeline using the same
We could see a lot of deleted files here but we did not anything interesting the file using unusual name were actually empty
So let us again start analysing the timeline viewer on autopsy
Since we are not able to gain much insight using the counts and details tab we can just switch to the lists tab for this purpose

Upon some tinkering and utilizing some filters i came across shred possibly a anti forensic 
![](attachment/4ea8e87b89d58868c36da93fb124599c.png)
We are asked to analys the events basically close to this timeline for the disk image
We are basically having shred at two lines for the first timeline i did not find anything interesting intially
For the second
![](attachment/6a8125e487e09a383feb0bd219622deb.png)
We find a chat here just above the shred let us analyze its contents
![](attachment/314a75e67170be1a34ca4450077a7ea1.png)
![](attachment/c3b8bd97858759fca71338bae165e933.png)
Again we are basically having a base64 text
![](attachment/b18414a0281d2b361e462dfbc41b69ed.png)
Now we successfully have got our flag
This year's forensics challenges were more focused on disk forensics, the timeline explorer part was the most fun of these as i had little to no experience using also the the git's last challenge was also quite great . This year' s forensics section was not as hard as hard as last year but still was quite great. Hats off to picoCTF team for that. 