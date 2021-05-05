package appserver.server;

import java.util.ArrayList;

/**
 *
 * @author Dr.-Ing. Wolf-Dieter Otte
 */
public class LoadManager {

    static ArrayList<String> satellites = null;
    static int lastSatelliteIndex = -1;
    static int currentSatelliteIndex = 0;
    
    public LoadManager() {
        satellites = new ArrayList<>();
    }

    public void satelliteAdded(String satelliteName) {
        // add satellite
            //add satellite name to ArrayList
            satellites.add( satelliteName );
            
            //increment lastSatelliteIndex
            lastSatelliteIndex++;
      
    }

    //note: assumes you actually register a satellite before this is called
    public String nextSatellite() {
        
        //int numberSatellites;    not sure what otte planned with this var,
                                 //left it just in case.
        String foundSatellite;
        
        synchronized (satellites) {
            //return the satellite name according to a round robin methodology
                //chect if satellite index is past end of arraylist
                if(currentSatelliteIndex > lastSatelliteIndex )
                {
                    //then index beyond end of list, back to beginning.
                    currentSatelliteIndex = 0;
                }
                
                //get satellite at index
                foundSatellite = satellites.get( currentSatelliteIndex );
                
                //increment current satellite index
                currentSatelliteIndex++;
        }
        //return satellite obtained from list
        return foundSatellite;
    }
}
