---
title: Notes on Boat Design and Lofting
---
_Copyright (C) Bruce MacKinnon, 2025.  Contact info at bottom of the page for comments/corrections._

These two papers are very interesting because they describe a ship design system that ran on an IBM 1620:

* [US DOD Paper: Mathematical Ship Lofting - Part I](https://apps.dtic.mil/sti/tr/pdf/AD0406367.pdf)
* [US DOD Paper: Mathematical Ship Lofting - Part I Volume 2 on Mathematical Fairing](https://apps.dtic.mil/sti/tr/pdf/AD0406715.pdf). _"To provide a basis for a mathematical fairing method, we must reduce the subjective definition of the word "fair" to a more precise mathematical definition."_

[A 1978 Thesis from MIT: "Computer Aided Geometric Variation and Fairing of Ship Hull Forms"](https://apps.dtic.mil/sti/tr/pdf/ADA086640.pdf)

[Paper: "The Fairing of Ship Lines on a High-Speed
Computer"](https://www.ams.org/journals/mcom/1961-15-076/S0025-5718-1961-0128588-2/S0025-5718-1961-0128588-2.pdf)

[Surface Fairing for Ship Hull Design Applications](https://upcommons.upc.edu/bitstream/handle/2117/97247/1400350099.pdf?sequence=1&isAllowed=y).

A more recent paper (PhD thesis from UCB) describes
the use of [Minimum Variation Curves (MVC)](https://www2.eecs.berkeley.edu/Pubs/TechRpts/1993/CSD-93-732.pdf).

Minimum Energy Curves (MEC) are referenced in some of the
literature.  [Here's a paper](https://people.csail.mit.edu/bkph/AIM/AIM-612-OCR.pdf) and [another paper](https://homepage.divms.uiowa.edu/~whan/VI_HVI/JH90.pdf).

The formal definition of a "fair curve" from the DOD paper is proposed using 
these criteria:
* The curve Y(X) must be continuous
* Its first derivative must be continuous
* Its second derivative must be continuous
* The curve must be completely free of extraneous inflection
points while possessing those inherent in the data.
* Deviation from scaled offsets must be as small as possible,
provided tge  above four conditions hold.
* Curve must look good to the eye.

The DOD paper also talks about something called a 
"Analytic Spline:"

_"Thin beam theory (based on the Bernoulli-Euler Equation) 
shows that a thin beam (e.g., batten) supported at a 
finite number of points, under small deflections, can 
be represented by a series of cubic equations (a single 
cubic in each interval defined by two successive points of
support) with any two neighboring cubics having equal ordinate values, first derivatives and second derivatives at the point of support common to both curves."_

And later:

_"One point we would like to emphasize is that in curve-fairing, as opposed
to curve-fitting, the main objective is not to pass exactly through the
data points, but that the curve be pleasing to the eye and possess only
those inflection points as indicated by the data. Only after these
fairness conditions have been satisfied can we ask for the curve which
minimizes the deviation. The problem would be less complicated were it
a curve-fitting problem and not a curve-fairing problem."_

A linear programming problem is constructed that satisfies
the mathematic constraints and minimizes the error between
the design offsets and the candidate fair curve.

Linear programs are problems that can be expressed in standard form as:

* Find a vector x
* that maximizes c<sup>T</sup>x
* subject to Ax ≤ b
* and x ≥ 0

Here the components of x are the variables to be determined, 
c and b are given vectors and A is a given matrix taken from the problem description. The function whose value is to be maximized (x -> c<sup>T</sup>x)
is called the objective function. 

The DOD paper fits the design offsets using a polynomial
function that they call the "analytic spline" Y(X) where X is the abscissa (i.e. the distance along the centerline for a half-breadth plan view) and Y is the ordinal (i.e. offset) from the centerline. The spline uses a function of this form (see equation 2):

Y(X) = A<sub>0</sub> + A<sub>1</sub>X + A<sub>2</sub>X<sup>2</sup> + A<sub>3</sub>X<sup>3</sup> + A<sub>4</sub>(X - a<sub>1</sub>)<sup>3</sup><sub>#</sub> + A<sub>5</sub>(X - a<sub>2</sub>)<sup>3</sup><sub>#</sub> + ...

Where the special term A(X - a)<sup>3</sup><sub>#</sub> is A(X - a)<sup>3</sup>
when X > a and 0 when X <= a. In other words, the term is shut off until the independent/abscissa variable X reaches a. 

### Demonstration of Continuous First and Second Derivatives

In keeping with the formal definition of a fair curve, this spline function has continuous first and second derivatives. This is demonstrated as follows:

The first derivative at X <= a<sub>1</sub>:

Y'(X) = A<sub>1</sub> + 2A<sub>2</sub>X + 3A<sub>3</sub>X<sup>2</sup>

and at X > a<sub>1</sub>:

Y'(X) = A<sub>1</sub> + 2A<sub>2</sub>X + 3A<sub>3</sub>X<sup>2</sup> + 3A<sub>4</sub>(X - a<sub>1</sub>)<sup>2</sup>

This is continuous at the X = a<sub>1</sub> boundary because the last term above starts off as 0.

Similarly, the second derivative at X <= a<sub>1</sub>:

Y''(X) = 2A<sub>2</sub> + 6A<sub>3</sub>X

and at X > a<sub>1</sub>:

Y''(X) = 2A<sub>2</sub> + 6A<sub>3</sub>X + 6A<sub>4</sub>(X - a<sub>1</sub>)

This is also continuous at the X = a boundary for the same reason.

The function **does not** have a continuous third derivative since at X <= a<sub>1</sub>:

Y'''(X) = 6A<sub>3</sub>

and at X > a<sub>1</sub>:

Y''(X) = 6A<sub>3</sub> + 6A<sub>4</sub>

Notice there is a jump of 6A<sub>4</sub> at the X = a<sub>1</sub> boundary.

### Regarding the Sign of the Second Derivative (i.e. curve direction)












You might wonder how linear programming can be applied to a problem characterized by a cubic polynomial, but keep in mind that the solver is determining the A<sub>n</sub> coefficients - the X and target Y(X) are known for a given offset.  *The problem is linear in the A<sub>n</sub> coefficients.* The notation can be a bit misleading because the Xs in the spline formulation are not the xs that the linear program is trying to find.






