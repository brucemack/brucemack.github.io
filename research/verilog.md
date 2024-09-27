## Unexpected Behavior (Shorted Ports)

When a module has an internal short between two ports:

        assign a = b;

and the two ports are connected to the same point on the outside
of the module:

        mod1 mod(.a(w), .b(w));

It appears that we end up with an undefined behavior: w = x.

This needs to be researched.

## Module Definition and Reference

Defining a module called mode_name_1:

        module mod_name_1(a, b);
        ...
        endmodule



Using a module called mod_name_1:

        mod_name_1 mod_instance_name(.b(W_A), .a(W_D));

Here wire W_D is passed into the port called "a" of the module.
