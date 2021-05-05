This server is built to allow for a client to connect and request a specific tool/class file.

This request is immediately sent to a satellite server to allow for the job to be handled while the main server keeps listening for more requests.

The satellite will then check if it has the tool in its cache, and if not, it will request the tool from a third and final server that is meant to send the correct tool.

In order to run the program, the SimpleWebServer must first be run, followed by the Server, followed then by the SatelliteServer (3 possible ones, only difference
is config file), and finally the client is run

The three different servers being used can all be run from the same device as they listen on different ports, and they can continually run to handle requests.