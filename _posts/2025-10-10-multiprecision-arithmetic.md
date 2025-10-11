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

## Division

If the goal is to divide Q = N / D, a starting estimate
for Q can be made by shifting N and D to the right by 
S bits.  Because Q = (N / s) / (D / s).

But this only works if there is significance in the first
S bits of both N and D. So a different algorithm would
look at the S _most significant_ bits of N and D, keeping
in mind that the amount of the shift might be different 
for the two numbers. 

## Modulo

Discussion of multi-precision modulo: https://stackoverflow.com/questions/27057920/large-integer-arithmetic-how-to-implement-modulo

Summary: when computing D mod M you can remove any integer multiple of M from D withing impacting the answer. So keep
doing that until D - Q*M <= M, and then modulo = D - Q*M.
This requires (1) a fast multiply (b) an iterative algorithm and (c) and a way of improving Q.

Another option: Figure out what 1/M is and then multiply
it by D to find Q. This might use the Newton-Raphson algorithm.


# References

* A GNU Library: https://gmplib.org/


