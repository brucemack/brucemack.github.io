

Overview of the SPICE algorithm: http://www.ecircuitcenter.com/SpiceTopics/Overview/Overview.htm

A thesis paper that includes some SPICE internals: https://eprints.soton.ac.uk/347886/1/__soton.ac.uk_ude_PersonalFiles_Users_slb1_mydocuments_TarekThesis.pdf

Helpful info on non-linear solving: https://designers-guide.org/analysis/dg-spice/ch2.pdf

A good/relevant lecture series:

* Netlists: https://aice.sjtu.edu.cn/msda/data/courseware/SPICE/lect05_netlist_grammar_brief.pdf
* Simulator Architecture: https://aice.sjtu.edu.cn/msda/data/courseware/SPICE/lect06_simulator_design.pdf
* (Lecture 7) Element Stamping: https://aice.sjtu.edu.cn/msda/data/courseware/SPICE/lect07_element_stamping.pdf
* (Lecture 8) Non-Linear Element Stamping: https://aice.sjtu.edu.cn/msda/data/courseware/SPICE/lect08_nonlinear_stamp.pdf
* (Lecture 9) Linear Solver: LU Solver and Sparse Matrix: https://aice.sjtu.edu.cn/msda/data/courseware/SPICE/lect09_solver_LU_sparse.pdf
* (Lecture 10) Integration Methods for Transient Simulation: https://aice.sjtu.edu.cn/msda/data/courseware/SPICE/lect10_integration_methods.pdf

Also: http://emlab.illinois.edu/ece546/Lect_16.pdf


Steps
* Formulation of circuit equations using Modified Nodal Analysis (MNA).
  * Use KCL to obtain a system of equations. 
  * Express the equations as a Differential Algebraic Equation (DAE). 
  * The original paper (Ho/Ruehili/Brennan): https://cseweb.ucsd.edu/classes/fa04/cse245/Reading/MNA.pdf. Note that Brennan was at IBM Watson working on circuit design automation in the early 1960's.
    * Very good video reference: https://www.youtube.com/playlist?list=PLlsTHbFeR7v0QG8Q4l6oc7d---eKKSKTz
  * A paper that gets into the details of the DAE part.
* Evaluating time-varying behavior of the design using numerical integration (applied to non-linear elements of the circuit).
* Solving the non-linear circuit model using Newton-Raphson (NR). The NR method allows us to 
fund the roots of an arbitrary real-valued function using successive approximation. This assumes that 
we have the derivative of the function (but that function doesn't need to be linear).
* Solving the resulting linear system of equations using Sparse LU Decomposition.


If we have the I = f(v) relationship and we know I, NR can be used to find the corresponding V 
without knowing the inverse of f().

MNA needs to do something special on the right-hand side for anything that acts like a 
current source.

STEPS:

_In the "model evaluation phase" SPICE calculates the conductances and currents through 
different circuit elements and updates their corresponding entries in the circuit matrix.
For non-linear elements the simulator must search for an "operating point" using NR
iteration, which requires repeated evaluation of the model equations per time-step._

What is the operating point that we searching for? Conductance and current.



Time-Varying Components (Dynamic Elements)

We don't have an analytical version of the dynamic/time-varying function y(t), but 
we have a differential equation that y(t) must satisfy.  Using Euler's method (or
some other discretation method) we can write y(tn) as a function of y(tn-1) at
each step. So that means that the obtained value of y(tn-1) from the previous 
step will need to be plugged into the system of equations on each step.

Non-Linear Components

Here we end up with a situation where KCL has non-linear term in it (for 
example, i(v) = k1 * exp(k2 * v)).

