---
title: Notes on Multiprecision Arithmetic
---

Arithmetic operations on integers that are larger than the word-size 
of the processor. Sometimes known as arbitrary-precision arithmetic, 
but "arbitrary" is a more general case of "multiple."

Python does this automatically. Java uses BigInteger. There are other 
libraries.

This comes up (among other places) in RSA cryptography where we need
to compute things like:

c = (m<sup>e</sup>) mod n

With very large (ex: 128-bit) numbers.

# Representation Using Multiple Digits

A two-digit representation using base B:

x = x<sub>1</sub>B<sup>m</sup> + x<sub>0<sub>

# Addition

The addition to two N-digit numbers will result in (at most) an N+1 digit 
number.

# Multiplication

The multiplication of two N-digit number will result in (at most) a
2N digit number.

Karatsuba is a common efficiency improvement: https://en.wikipedia.org/wiki/Karatsuba_algorithm.

# References

* A GNU Library: https://gmplib.org/


