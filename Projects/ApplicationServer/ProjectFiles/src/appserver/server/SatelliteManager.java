package appserver.server;

import appserver.comm.ConnectivityInfo;
import java.util.Enumeration;
import java.util.Hashtable;

/**
 *
 * @author Dr.-Ing. Wolf-Dieter Otte
 */
public class SatelliteManager {

    // (the one) hash table that contains the connectivity information of all satellite servers
    static private Hashtable<String, ConnectivityInfo> satellites = null;

    public SatelliteManager() {
        //initialize satellite hashtable
        satellites = new Hashtable<>();
    }

    public void registerSatellite(ConnectivityInfo satelliteInfo) {
        //get name from conn info
        String satelliteName = satelliteInfo.getName();
        
        //register satellite with name as key, conninfo as value
        satellites.put(satelliteName, satelliteInfo);
    }

    public ConnectivityInfo getSatelliteForName(String satelliteName) {
        //retrieve sattelite from hashtable with given name
        ConnectivityInfo foundInfo = satellites.get( satelliteName );
        
        //return retrieved ConnectivityInfo
        return foundInfo;
    }
}
