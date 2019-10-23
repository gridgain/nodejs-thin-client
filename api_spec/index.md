# Node.js Client for GridGain

This thin client allows your Node.js applications to work with GridGain clusters via TCP.

A thin client is a lightweight GridGain client that connects to the cluster via a standard socket connection. It does not start in JVM process (Java is not required at all), does not become a part of the cluster topology, never holds any data or used as a destination of compute grid calculations.

What it does is it simply establishes a socket connection to a standard Ignite node​ and performs all operations through that node.

For more information, see [GridGain Node.js Thin Client documentation](https://www.gridgain.com/docs/8.7.6/developers-guide/thin-clients/nodejs-thin-client).