package appserver.server;

import appserver.comm.Message;
import static appserver.comm.MessageTypes.JOB_REQUEST;
import static appserver.comm.MessageTypes.REGISTER_SATELLITE;
import appserver.comm.ConnectivityInfo;
import java.io.IOException;
import java.io.ObjectInputStream;
import java.io.ObjectOutputStream;
import java.net.ServerSocket;
import java.net.Socket;
import java.util.Properties;
import utils.PropertyHandler;

/**
 *
 * @author Dr.-Ing. Wolf-Dieter Otte
 */
public class Server {

    // Singleton objects - there is only one of them. For simplicity, this is not enforced though ...
    static SatelliteManager satelliteManager = null;
    static LoadManager loadManager = null;
    static ServerSocket serverSocket = null;

    public Server(String serverPropertiesFile) {

        // create satellite manager and load manager
        satelliteManager = new SatelliteManager();
        loadManager = new LoadManager();
        
        PropertyHandler configuration = null;
        
        try
        {
            configuration = new PropertyHandler(serverPropertiesFile);
        } catch (IOException e)
        {
            // no use carrying on, so bailing out ...
            System.err.println("No server config file found, bailing out ...");
            System.exit(1);
        }
        
        try
        {
            serverSocket = new ServerSocket(Integer.parseInt(configuration.getProperty("PORT")));
        } catch (IOException e)
        {
            System.err.println("Could not open server socket on port" + configuration.getProperty("PORT"));
            System.exit(1);
        }
    }

    public void run() {
        while(true)
        {
            try
            {
                System.out.println("[Server.run] Waiting for connections");
                Socket client = serverSocket.accept();
                System.out.println("[Server.run] A connection to a client is established!");
                (new ServerThread(client)).run();
            } catch (IOException e)
            {
                System.err.println("Could not accept client connection.");
            }
        }
    }

    // objects of this helper class communicate with satellites or clients
    private class ServerThread extends Thread {

        Socket client = null;
        ObjectInputStream readFromNet = null;
        ObjectOutputStream writeToNet = null;
        Message message = null;

        private ServerThread(Socket client) {
            this.client = client;
        }

        @Override
        public void run() {
            try
            {
                readFromNet = new ObjectInputStream( client.getInputStream() );
                writeToNet = new ObjectOutputStream( client.getOutputStream() );
            } catch (IOException ioe)
            {
                System.err.println("IOException: " + ioe);
            }
            
            try
            {
                message = (Message) readFromNet.readObject();
            } catch (Exception e)
            {
                System.err.println(e);
            }

            
            // process message
            switch (message.getType()) {
                case REGISTER_SATELLITE:
                    // read satellite info
                    ConnectivityInfo satInfo = (ConnectivityInfo) message.getContent();
                    
                    // register satellite
                    synchronized (Server.satelliteManager) {
                        Server.satelliteManager.registerSatellite(satInfo);
                    }

                    // add satellite to loadManager
                    synchronized (Server.loadManager) {
                        Server.loadManager.satelliteAdded(satInfo.getName());
                    }
                    
                    break;

                case JOB_REQUEST:
                    System.err.println("\n[ServerThread.run] Received job request");

                    String satelliteName = null;
                    ConnectivityInfo satCon = null;
                    
                    synchronized (Server.loadManager) {
                        satelliteName = Server.loadManager.nextSatellite(); 
                    }
                    
                    synchronized (Server.satelliteManager) {
                        satCon = Server.satelliteManager.getSatelliteForName(satelliteName);
                    }
                    
                    Socket satellite = null;
                    try
                    {
                        satellite = new Socket(satCon.getHost(), satCon.getPort());
                        ObjectInputStream readFromSat = new ObjectInputStream( satellite.getInputStream() );
                        ObjectOutputStream writeToSat = new ObjectOutputStream( satellite.getOutputStream() );
                        
                        writeToSat.writeObject(message);
                        Object result = readFromSat.readObject();
                        writeToNet.writeObject(result);
                    } catch (Exception e)
                    {
                        System.err.println(e);
                    }

                    break;

                default:
                    System.err.println("[ServerThread.run] Warning: Message type not implemented");
            }
        }
    }

    // main()
    public static void main(String[] args) {
        // start the application server
        Server server = null;
        if(args.length == 1) {
            server = new Server(args[0]);
        } else {
            server = new Server("../../config/Server.properties");
        }
        server.run();
    }
}
