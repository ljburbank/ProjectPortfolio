This project is meant to simulate an operating system starting up and running processes using op codes from an input file.

The simulator will keep time of every event that happens, as well as handle different scehduling algorithms.

Compiling it uses the makefile, and then the object to run after is called Simulator, which can be run using: ./Simulator <config_file>


** It should be noted the threading system involved with the program uses the Linux kernel, meaning the program does not run correctly on Windows.

** The simtimer was also provided by the course professor, with some editing done to it by me.