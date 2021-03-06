package chatapp;

import java.io.IOException;
import java.net.ServerSocket;

public class Receiver extends Thread
{
    static ServerSocket receiverSocket = null;

    public Receiver( NodeInfo myNode )
    {
        try
        {
            receiverSocket = new ServerSocket( myNode.getPort() );
        }
        catch ( IOException err )
        {
            err.printStackTrace();
        }
    }

    @Override
    public void run()
    {
        while( true )
        {
            try
            {
                ( new ReceiverWorker( receiverSocket.accept() ) ).start();
            }
            catch ( IOException err )
            {
                err.printStackTrace();
            }
        }
    }
}
