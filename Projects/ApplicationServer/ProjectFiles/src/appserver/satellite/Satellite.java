package appserver.satellite;

import appserver.job.Job;
import appserver.comm.ConnectivityInfo;
import appserver.job.UnknownToolException;
import appserver.comm.Message;
import static appserver.comm.MessageTypes.JOB_REQUEST;
import static appserver.comm.MessageTypes.REGISTER_SATELLITE;
import appserver.job.Tool;
import java.io.IOException;
import java.io.ObjectInputStream;
import java.io.ObjectOutputStream;
import java.lang.reflect.InvocationTargetException;
import java.net.InetAddress;
import java.net.ServerSocket;
import java.net.Socket;
import java.net.UnknownHostException;
import java.util.HashMap;
import java.util.logging.Level;
import java.util.logging.Logger;
import utils.PropertyHandler;

/**
 * Class [Satellite] Instances of this class represent computing nodes that execute jobs by
 * calling the callback method of tool a implementation, loading the tool's code dynamically over a network
 * or locally from the cache, if a tool got executed before.
 *
 * @author Dr.-Ing. Wolf-Dieter Otte
 */
public class Satellite extends Thread {

    private ConnectivityInfo satelliteInfo = new ConnectivityInfo();
    private ConnectivityInfo serverInfo = new ConnectivityInfo();
    private HTTPClassLoader classLoader = null;
    private HashMap <String, Tool> toolsCache;

    public Satellite(String satellitePropertiesFile, String classLoaderPropertiesFile, String serverPropertiesFile) {

        PropertyHandler configuration = null;
        
        try {
            configuration = new PropertyHandler(satellitePropertiesFile);
        } catch (IOException e) {
            // no use carrying on, so bailing out ...
            System.err.println("No satellite config file found, bailing out ...");
            System.exit(1);
        }
        
        satelliteInfo.setName( configuration.getProperty("NAME") );
        satelliteInfo.setPort( Integer.parseInt(configuration.getProperty("PORT")) );
        
        configuration = null;
        
        try {
            configuration = new PropertyHandler(serverPropertiesFile);
        } catch (IOException e) {
            // no use carrying on, so bailing out ...
            System.err.println("No server config file found, bailing out ...");
            System.exit(1);
        }
        
        serverInfo.setPort( Integer.parseInt(configuration.getProperty("PORT")) );
        serverInfo.setHost( configuration.getProperty("HOST") );
        
        configuration = null;
        
        try {
            configuration = new PropertyHandler(classLoaderPropertiesFile);
        } catch (IOException e) {
            // no use carrying on, so bailing out ...
            System.err.println("No class loader config file found, bailing out ...");
            System.exit(1);
        }
        
        String host = configuration.getProperty("HOST");
        int port = Integer.parseInt(configuration.getProperty("PORT"));
        
        try
        {
            classLoader = new HTTPClassLoader(host, port);
        } catch (Exception e)
        {
            System.err.println("Could not create class loader.");
        }
        
        configuration = null;
        
        toolsCache = new HashMap<>();
    }

    @Override
    public void run() {

        // register this satellite with the SatelliteManager on the server
        // ---------------------------------------------------------------
        try
        {
            Socket satServer = new Socket(serverInfo.getHost(), serverInfo.getPort());
            Message message = new Message(REGISTER_SATELLITE, satelliteInfo);
            
            ObjectOutputStream toSatServer = new ObjectOutputStream(satServer.getOutputStream());
            toSatServer.writeObject(message);
        } catch (IOException e)
        {
            System.err.println(e);
        }    
        
        ServerSocket server;
        try
        {
            server = new ServerSocket(satelliteInfo.getPort());
            
            while (true) {
                System.out.println("[Satellite.run] Waiting for connections on Port #" + satelliteInfo.getPort());
                Socket request = server.accept();
                System.out.println("[Satellite.run] A connection to a client is established!");
                (new SatelliteThread(request, this)).start();
            }
        } catch (Exception e)
        {
            System.err.println("Could not create server socket.");
        }
    }

    // inner helper class that is instanciated in above server loop and processes single job requests
    private class SatelliteThread extends Thread {

        Satellite satellite = null;
        Socket jobRequest = null;
        ObjectInputStream readFromNet = null;
        ObjectOutputStream writeToNet = null;
        Message message = null;

        SatelliteThread(Socket jobRequest, Satellite satellite) {
            this.jobRequest = jobRequest;
            this.satellite = satellite;
        }

        @Override
        public void run() {
            try
            {
                writeToNet = new ObjectOutputStream( jobRequest.getOutputStream() );
                readFromNet = new ObjectInputStream( jobRequest.getInputStream() );
                message = (Message) readFromNet.readObject();
            } catch (Exception e)
            {
                System.err.println("Exception: " + e);
            }
            
            switch (message.getType()) {
                case JOB_REQUEST:
                    Job job = (Job) message.getContent();
                    String toolName = job.getToolName();
                    Object params = job.getParameters();
                    
                    try
                    {
                        Tool tool = getToolObject(toolName);
                        Object result = tool.go(params);
                        writeToNet.writeObject(result);
                    } catch (Exception e)
                    {
                        System.err.println(e);
                    }
                    
                    break;

                default:
                    System.err.println("[SatelliteThread.run] Warning: Message type not implemented");
            }
        }
    }

    /**
     * Aux method to get a tool object, given the fully qualified class string
     * If the tool has been used before, it is returned immediately out of the cache,
     * otherwise it is loaded dynamically
     */
    public Tool getToolObject(String toolClassString) throws UnknownToolException, ClassNotFoundException, InstantiationException, IllegalAccessException {

        Tool toolObject;

        if ((toolObject = toolsCache.get(toolClassString)) == null)
        {
            System.out.println("\nTool's Class: " + toolClassString);
            if (toolClassString == null)
            {
                throw new UnknownToolException();
            }

            Class<?> toolClass = classLoader.loadClass(toolClassString);
            try {
                toolObject = (Tool) toolClass.getDeclaredConstructor().newInstance();
            } catch (Exception ex) {
                Logger.getLogger(Satellite.class.getName()).log(Level.SEVERE, null, ex);
                System.err.println("[Satellite] getTool() - Exception");
            }
            toolsCache.put(toolClassString, toolObject);
        }
        else 
        {
            System.out.println("Operation: \"" + toolClassString + "\" already in Cache");
        }
        
        return toolObject;
    }

    public static void main(String[] args) {
        // start the satellite
        Satellite satellite = new Satellite(args[0], args[1], args[2]);
        satellite.run();
    }
}
