---
title: RSA Cryptography Explained — From Math to Attack
date: 2026-02-15
category: article
tags:
  - cryptography
  - rsa
  - math
  - ctf
author: Akshat
---

# RSA Cryptography Explained — From Math to Attack

RSA is the most famous public-key cryptosystem in existence. It's used in TLS, SSH, PGP, and countless other protocols. It's also the most common cryptography category in CTFs. This article walks through the math, the implementation, and the most common attack patterns.

---

## The Big Idea

RSA relies on a simple asymmetry: **it's easy to multiply two large primes together, but hard to factor the result.**

Given:
- `p = 61`, `q = 53`
- `n = p × q = 3233`

Going the other direction — factoring 3233 back into 61 × 53 — is trivial for small numbers. For 2048-bit numbers (which have ~600 digits), it's computationally infeasible with current hardware.

---

## Key Generation

Here's how RSA keys are generated:

1. **Choose two large primes** `p` and `q`
2. **Compute `n = p × q`** — this is the modulus (public)
3. **Compute `φ(n) = (p-1)(q-1)`** — Euler's totient (private)
4. **Choose public exponent `e`** — usually `65537`, coprime to `φ(n)`
5. **Compute private exponent `d = e⁻¹ mod φ(n)`**

Your **public key** is `(n, e)`. Your **private key** is `(n, d)`.

---

## Encryption & Decryption

**Encrypting a message `m`:**

```
c = m^e mod n
```

**Decrypting ciphertext `c`:**

```
m = c^d mod n
```

The magic: `(m^e)^d ≡ m (mod n)` — this follows from Euler's theorem.

In Python:
```python
# Encryption
c = pow(m, e, n)

# Decryption
m = pow(c, d, n)
```

---

## Common CTF Attacks

### 1. Small `e` — Cube Root Attack

If `e = 3` and the message `m` is small such that `m^3 < n`, then the modular reduction doesn't happen and:

```
c = m^3
m = cube_root(c)
```

```python
import gmpy2

m = int(gmpy2.iroot(c, e)[0])
print(m.to_bytes(50, 'big'))
```

### 2. Factoring with Small Primes

If `n` is small or uses weak primes, you can factor it directly:

```bash
# Using factordb.com or yafu
python3 -c "from sympy import factorint; print(factorint(n))"
```

Or use [factordb.com](https://factordb.com) — a database of factored numbers.

### 3. GCD Attack — Shared Prime

If two different `n` values share a prime factor:

```python
from math import gcd

p = gcd(n1, n2)  # Common factor!
q1 = n1 // p
q2 = n2 // p
```

This completely breaks both keys.

### 4. Wiener's Attack — Small `d`

If the private exponent `d` is too small (less than `n^0.25`), Wiener's attack uses continued fractions to recover `d`:

```python
# pip install pycryptodome
from Crypto.PublicKey import RSA
# Use a Wiener attack library: rsactftool includes this
# python3 RsaCtfTool.py --publickey key.pem --attack wiener
```

### 5. Broadcast Attack (Håstad)

If the same message is encrypted with the same `e=3` but three different public keys:

```python
from sympy.ntheory.modular import crt

# Collect (c1,n1), (c2,n2), (c3,n3)
M, _ = crt([n1,n2,n3], [c1,c2,c3])
m = int(iroot(M, 3)[0])
```

---

## Quick Reference: RSA CTF Checklist

When you encounter RSA in a CTF:

- [ ] Is `e` small (3, 5, 17)?
- [ ] Can `n` be factored? Try factordb.com
- [ ] Do you have multiple ciphertexts with the same `e` and different `n`?
- [ ] Is `d` suspiciously small?
- [ ] Is the same message encrypted multiple times with the same key?
- [ ] Try [RsaCtfTool](https://github.com/RsaCtfTool/RsaCtfTool) — it automates many attacks

---

## Useful Tools

```bash
# RsaCtfTool — Swiss Army knife for RSA CTFs
pip install RsaCtfTool

# Try multiple attacks automatically
python3 RsaCtfTool.py --publickey key.pem --attack all --uncipherfile cipher.bin

# Or pass parameters directly
python3 RsaCtfTool.py -n <N> -e <E> -c <C> --attack all
```

---

## Conclusion

RSA is elegant in theory but fragile in practice if implemented carelessly. The math is right — it's the choices around key size, exponent selection, and randomness that create vulnerabilities.

In CTFs, RSA challenges almost always exploit one of:
- Small exponents
- Factorable moduli
- Shared primes across keys
- Missing randomness in padding

Learn the math, learn the attacks, and you'll find RSA challenges very approachable.

Next up: I'll write about **elliptic curve cryptography (ECC)** — same ideas, harder math, and increasingly common in CTFs.
