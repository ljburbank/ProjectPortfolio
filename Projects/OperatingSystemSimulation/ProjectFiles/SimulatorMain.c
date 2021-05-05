// header files
#include <stdio.h>
#include "ConfigAccess.h"
#include "MetaDataAccess.h"
#include "simulator.h"

/*
Function name: main
Algorithm: driver function to test config and metadata file
           upload operation together
Precondition: none
Postcondition: returns zero (0) on success
Exceptions: none
Note: demonstrates use of combined files
*/
int main( int argc, char **argv )
{
    // initialize function/variables
    int configAccessResult, mdAccessResult, runSimResult;
    char configFileName[ MAX_STR_LEN ];
    char mdFileName[ MAX_STR_LEN ];
    ConfigDataType *configDataPtr;
    OpCodeType *mdData;
    
    // display program title
        // function: printf
    printf( "\nSimulator Program\n" );
    printf( "=================\n" );
    
    // display component title
        // function: printf
    printf( "\nUploading Configuration Files\n" );
    
    // check for not correct number of command line arguments (two)
    if( argc < 2 )
    {
        // print missing command line argument error
            // function: printf
        printf( "ERROR: Program requires file name for config file " );
        printf( "as command line argument\n" );
        printf( "Program Terminated\n" );
        
        // return non-normal program result
        return 1;
    }
    
    // get data from configuration file
        // function: copyString, getConfigData
    copyString( configFileName, argv[ 1 ] );
    configAccessResult = getConfigData( configFileName, &configDataPtr );
    
    // check for failed upload
    if( configAccessResult != NO_ERR )
    {
        // display configuration upload error
            // function: displayConfigError
        displayConfigError( configAccessResult );
        
        // clear config data
            // function: clearConfigData
        clearConfigData( &configDataPtr );
        
        // add endline for vertical spacing
            // function: printf
        printf( "\n" );
        
        // return non-normal program result
        return 1;
    }
    
    // display component title
        // function: printf
    printf( "\nUploading Meta Data Files\n" );
    
    // get data from meta data file
        // function: copyString, getOpCodes 
    copyString( mdFileName, configDataPtr->metaDataFileName );
    mdAccessResult = getOpCodes( mdFileName, &mdData );
    
    // check for failed upload
    if( mdAccessResult != NO_ERR )
    {
        // display meta data error message
            // function: displayMetaDataError( mdAccessResult );
        displayMetaDataError( mdAccessResult );
        
        // clear config and meta data
            // function: clearConfigData, clearMetaDataList
        clearConfigData( &configDataPtr );
        mdData = clearMetaDataList( mdData );
        
        // add endline for vertical spacing
            // function: printf
        printf( "\n" );
        
        // return non-normal program result
        return 1;
    }
    
    // begin the simulation with the gathered data
        //function: beginSimulation
    runSimResult = runSimulator( configDataPtr, mdData );
    
    if( runSimResult != NO_ERR )
    {
        // check for errors
        displaySimError( runSimResult );
        
        // clean up
        clearConfigData( &configDataPtr );
        mdData = clearMetaDataList( mdData );
        
        // shut down for failure
        return 1;
    }
    
    // shut down, clean up program
    
        // clear config and meta data
            // function: clearConfigData, clearMetaDataList
        clearConfigData( &configDataPtr );
        mdData = clearMetaDataList( mdData );
        
        // add endline for vertical spacing
            // function: printf
        printf( "\n" );
        
        // return success
        return 0;
}
