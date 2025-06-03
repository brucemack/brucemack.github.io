---
title: Notes on Boat Design and Lofting
---
_Copyright (C) Bruce MacKinnon, 2025.  Contact info at bottom of the page for comments/corrections._

[US DOD Paper: Mathematical Ship Lofting - Part I]([https://apps.dtic.mil/sti/tr/pdf/AD0406367.pdf)

[US DOD Paper: Mathematical Ship Lofting - Part I Volume 2 on Mathematical Fairing](https://apps.dtic.mil/sti/tr/pdf/AD0406715.pdf). _"To provide a basis for a mathematical fairing method, we must reduce the subjective definition of the word "fair" to a more precise mathematical definition."_

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

