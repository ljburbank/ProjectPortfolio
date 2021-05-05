// header
#include "simulator.h"


/* This is the driver function for the simulation. It manages data as
   needed for the rest to run through the use of PCBs. It also displays
   the non-process information, and runs the processes.
*/
int runSimulator( ConfigDataType *configDataPtr, OpCodeType *mdDataHead )
{
    // initialize PCB linked list head
    PCB *pcbHeadPtr = NULL;
    
    // initialize display head with the log file header info
    DisplayNode *displayPtr = generateLogFileHeader( configDataPtr );

    // initialize file parameters
    char fileName[ 100 ];
    char *fileFlag = "w+";
    int fileAccess = NO_ERR; // since it might not even be accessed
    int logCode = configDataPtr->logToCode;
    int schedCode = configDataPtr->cpuSchedCode;

    copyString( fileName, configDataPtr->logToFileName );

    // initialize struct for accessTimer parameters
    TimerArgs *accessArgs = (TimerArgs *) malloc( sizeof( TimerArgs ) );

    // declare variables
    int createResult;
    char *strBuffer;
    char formStrBuffer[ 100 ]; // separate buffer needed for sprintf
    PCB *nextProcess; // needed for SJF scheduling
    
    
    // display simulation beginning
        // function: printf
    strBuffer = "\n=================\n";
    displayPtr = displayStr( strBuffer, displayPtr, configDataPtr );
    strBuffer = "Begin Simulation\n\n";
    displayPtr = displayStr( strBuffer, displayPtr, configDataPtr );
    
    // check that metadata head is a system start; if not, return error
    if( (mdDataHead->opLtr != 'S') || (compareString( mdDataHead->opName,
                                                        "start" ) != STR_EQ) )
    {
        // cleanup
        free( accessArgs );
        clearDisplayData( displayPtr );
        clearPcbData( pcbHeadPtr );
        
        return NO_SYSTEM_START_ERR;
    }
    
    // start the timer
    accessArgs->flag = ZERO_TIMER;
    accessTimer( accessArgs );
    
    // display system start information
    sprintf( formStrBuffer, "%10s, OS: System Start\n", accessArgs->str );
    displayPtr = displayStr( formStrBuffer, displayPtr, configDataPtr );
    
    accessArgs->flag = LAP_TIMER; // stays like this for most
    
    accessTimer( accessArgs );
    sprintf( formStrBuffer, "%10s, OS: Create Process Control Blocks\n",
                                                            accessArgs->str );
    displayPtr = displayStr( formStrBuffer, displayPtr, configDataPtr );
    
    // create pcb's and initialize them to new in process of creation
    createResult = setProcesses( configDataPtr, mdDataHead->next,
                                                                &pcbHeadPtr );
    
    // check that pcb's loaded correctly
    if( createResult != NO_ERR )
    {
        
        // cleanup
        free( accessArgs );
        clearDisplayData( displayPtr );
        clearPcbData( pcbHeadPtr );
        
        return createResult;
    }
    
    // display PCB initialization
    accessTimer( accessArgs );
    sprintf( formStrBuffer, 
        "%10s, OS: All processes initialized in New state\n", accessArgs->str );
    displayPtr = displayStr( formStrBuffer, displayPtr, configDataPtr );
    
    // put PCB's into ready state and display success
    setToReady( pcbHeadPtr );
    
    accessTimer( accessArgs );
    sprintf( formStrBuffer, "%10s, OS: All processes now set in Ready state\n",
                                                              accessArgs->str );
    displayPtr = displayStr( formStrBuffer, displayPtr, configDataPtr );
    
    // check which scheduling is used
    if( schedCode == CPU_SCHED_SJF_N_CODE )
    {
        // loop through by checking if all are in EXIT using checkIfDone
        while( checkIfDone( pcbHeadPtr ) == False )
        {
            // get next process using getShortestJob
            nextProcess = getShortestJob( pcbHeadPtr );
            
            // runProcess and it will return the head of the display list
            displayPtr = runProcess( configDataPtr, nextProcess, displayPtr,
                                                                accessArgs );
        }
    }
    // else we can assume FCFS-N for now
    else
    {
        // start the process loop
        while( pcbHeadPtr != NULL )
        {
            // runProcess and it will return the head of the display list
            displayPtr = runProcess( configDataPtr, pcbHeadPtr, displayPtr,
                                                                accessArgs );
        
            // increment to the next pcb for the loop
            pcbHeadPtr = pcbHeadPtr->nextPCB;
        }
    }
    
    // display system stop and simulation end
    accessTimer( accessArgs );
    sprintf( formStrBuffer, "%10s, OS: System stop\n", accessArgs->str );
    displayPtr = displayStr( formStrBuffer, displayPtr, configDataPtr );
    
    strBuffer = "\nEnd Simulation - Complete\n";
    displayPtr = displayStr( strBuffer, displayPtr, configDataPtr );
    strBuffer = "=========================\n\n";
    displayPtr = displayStr( strBuffer, displayPtr, configDataPtr );
    
    // check if supposed to log to file
    if( logCode == LOGTO_BOTH_CODE || logCode == LOGTO_FILE_CODE )
    {
        // log the display linked list to the file
        fileAccess = logToFile( displayPtr, fileName, fileFlag );
    }
    
    // check that the file was logged successfully
    if( fileAccess != NO_ERR )
    {
        return fileAccess;
    }
    
    //cleanup
    free( accessArgs );
    clearDisplayData( displayPtr );
    clearPcbData( pcbHeadPtr );
    
    return NO_ERR;
}

/* Creates the PCB's by looking for A(start) op codes and assigning a process
   number and running time
*/
int setProcesses( ConfigDataType *configDataPtr, OpCodeType *mdDataHead,
                                                                PCB **pcbHead )
{
    // initialize a local head pointer and new node pointer
    PCB *localHeadPtr = NULL;
    PCB *newNodePtr;
    
    // initialize the current process number and runnning time total
    int runningProcessNum = 0;
    int runningProcessTime = 0;
    
    // reserve space for the new node
    newNodePtr = (PCB *) malloc( sizeof( PCB ) );
    
    // start outer loop for processes by checking for a process start
    while( (mdDataHead->opLtr == 'A') && (compareString( mdDataHead->opName,
                                                        "start" ) == STR_EQ ) )
    {
        // fill new node fields with appropriate values from the process start
        newNodePtr->startOpCode = mdDataHead;
        newNodePtr->processNumber = runningProcessNum;
        newNodePtr->processState = NEW; // all pcb's start in NEW state
        
        // get the next process after the start
        mdDataHead = mdDataHead->next;
        
        // start inner loop for op codes within the process; break on A found
        while( mdDataHead->opLtr != 'A' )
        {
            // memory does not calculate time due to different value usage
            if( mdDataHead->opLtr != 'M' )
            {
                // add the amount of ms the total by calculating it
                runningProcessTime += cycleConvert( configDataPtr, mdDataHead );
            }
            
            // get next op code before checking loop condition
            mdDataHead = mdDataHead->next;
        }
        
        // check to make sure the current op code is a process end
        if( compareString( mdDataHead->opName, "end" ) != STR_EQ )
        {
            // cleanup
            free( newNodePtr );
            
            return OP_CODE_OVERLAP_ERR;
        }
        
        // set the time field for the new node using the running total
        newNodePtr->processTime = runningProcessTime;
        
        // add the new node to the local PCB linked list
        localHeadPtr = addPcbNode( localHeadPtr, newNodePtr );
        
        // increment process number, and reset total time for next process
        runningProcessNum++;
        runningProcessTime = 0;
        
        // get the next op code to then test the loop condition with
        mdDataHead = mdDataHead->next;
    }
    
    // check to make sure the current op code is a system end
    if( (mdDataHead->opLtr != 'S') ||
            (compareString( mdDataHead->opName, "end" ) != STR_EQ) )
    {
        // cleanup
        free( newNodePtr );
        
        return NO_SYSTEM_END_ERR;
    }
    
    // make the parameter pcb pointer point to the local linked list
    *pcbHead = localHeadPtr;
    
    // cleanup
    free( newNodePtr );
    
    return NO_ERR;
}

/* This function is used to add a new node to the PCB linked list
   It does so by finding the next NULL slot in the list and filling
   it with the new information
*/
PCB *addPcbNode( PCB *localHead, PCB *newNode )
{
    // check if the localHead being looked at is NULL
    if( localHead == NULL )
    {
        // create a new PCB in the null slot
        localHead = (PCB *) malloc( sizeof( PCB ) );
        
        // fill in the newly created PCB information with the node to be added
        localHead->processNumber = newNode->processNumber;
        localHead->processState = newNode->processState;
        localHead->startOpCode = newNode->startOpCode;
        localHead->processTime = newNode->processTime;
        
        // set next node in the linked list to NULL
        localHead->nextPCB = NULL;
        
        return localHead;
    }
    
    // call the function again with the next node
    localHead->nextPCB = addPcbNode( localHead->nextPCB, newNode );
    
    return localHead;
}

/* Converts an op code cycle value to a time in ms.
   Uses the cycle raters from the config file
*/
int cycleConvert( ConfigDataType *configInfo, OpCodeType *opCode )
{
    // check if it uses the io cycle rate
    if( opCode->opLtr == 'I' || opCode->opLtr == 'O')
    {
        return (opCode->opValue * configInfo->ioCycleRate);
    }
    else
    {
        return (opCode->opValue * configInfo->procCycleRate);
    }
}

/* Sets all pcb's to ready state
*/
void setToReady( PCB *pcbHead )
{
    while( pcbHead != NULL )
    {
        pcbHead->processState = READY;
        pcbHead = pcbHead->nextPCB;
    }
}

/* Runs the process passed to it, and displays what is needed
   as it comes up. Also uses simtimer to display at the right
   time, and uses threads when doing IO operations.
*/
DisplayNode *runProcess( ConfigDataType *configPtr, PCB *pcbPtr,
                            DisplayNode *displayPtr, TimerArgs *accessArgs )
{
    // initialize the first op code and other variables used
    OpCodeType *currentOpCode = pcbPtr->startOpCode->next;
    char currentStr[ 100 ];
    pthread_t thread_id;
    int timePassed, memBase, memOffset, memAccessResult;
    
    // set seg fault flag in case for displaying
    Boolean segFault = False;
    
    // initialize the memory block linked list
    MemoryBlock *allocatedHead = NULL;
    
    // display the process starting information with the time
    accessTimer( accessArgs );
    sprintf( currentStr, "%10s, OS: Process %d selected with %d ms remaining\n",
                  accessArgs->str, pcbPtr->processNumber, pcbPtr->processTime );
    displayPtr = displayStr( currentStr, displayPtr, configPtr );
    
    //set the process to RUNNING and display it
    pcbPtr->processState = RUNNING;
    
    accessTimer( accessArgs );
    sprintf( currentStr, "%10s, OS: Process %d set in RUNNING state\n\n",
                                       accessArgs->str, pcbPtr->processNumber );
    displayPtr = displayStr( currentStr, displayPtr, configPtr );
    
    // start looping through the pcb op codes by looking for an A
    while( currentOpCode->opLtr != 'A' )
    {
        // check if the op code is an input operation
        if( currentOpCode->opLtr == 'I' )
        {
            accessTimer( accessArgs );
            sprintf( currentStr, "%10s, Process: %d, %s input start\n",
                accessArgs->str, pcbPtr->processNumber, currentOpCode->opName );
            displayPtr = displayStr( currentStr, displayPtr, configPtr );
            
            // create thread that will pass the amount of time the process takes
            timePassed = cycleConvert( configPtr, currentOpCode );
            pthread_create( &thread_id, NULL, runTimer, (void *)&timePassed );
            pthread_join( thread_id, NULL );
            
            accessTimer( accessArgs );
            sprintf( currentStr, "%10s, Process: %d, %s input end\n",
                accessArgs->str, pcbPtr->processNumber, currentOpCode->opName );
            displayPtr = displayStr( currentStr, displayPtr, configPtr );
        }
        if( currentOpCode->opLtr == 'O' )
        {
            accessTimer( accessArgs );
            sprintf( currentStr, "%10s, Process: %d, %s output start\n",
                accessArgs->str, pcbPtr->processNumber, currentOpCode->opName );
            displayPtr = displayStr( currentStr, displayPtr, configPtr );
            
            // create thread that will pass the amount of time the op code takes
            timePassed = cycleConvert( configPtr, currentOpCode );
            pthread_create( &thread_id, NULL, runTimer, (void *)&timePassed );
            pthread_join( thread_id, NULL );
            
            accessTimer( accessArgs );
            sprintf( currentStr, "%10s, Process: %d, %s output end\n",
                accessArgs->str, pcbPtr->processNumber, currentOpCode->opName );
            displayPtr = displayStr( currentStr, displayPtr, configPtr );
        }
        if( currentOpCode->opLtr == 'P' )
        {
            accessTimer( accessArgs );
            sprintf( currentStr, "%10s, Process: %d, run operation start\n",
                                       accessArgs->str, pcbPtr->processNumber );
            displayPtr = displayStr( currentStr, displayPtr, configPtr );
            
            // run the timer for the time passed by the op code
            timePassed = cycleConvert( configPtr, currentOpCode );
            runTimer( (void *)&timePassed );
            
            accessTimer( accessArgs );
            sprintf( currentStr, "%10s, Process: %d, run operation end\n",
                                       accessArgs->str, pcbPtr->processNumber );
            displayPtr = displayStr( currentStr, displayPtr, configPtr );
        }
        if( currentOpCode->opLtr == 'M' )
        {
            // memBase value calculated using integer division
            memBase = currentOpCode->opValue / 10000;
            // memOffset value calculated using modulus
            memOffset = currentOpCode->opValue % 10000;
            
            accessTimer( accessArgs );
            sprintf( currentStr, 
                     "%10s, Process: %d, MMU attempt to %s %04d/%04d\n",
                                    accessArgs->str, pcbPtr->processNumber,
                                    currentOpCode->opName, memBase, memOffset );
            displayPtr = displayStr( currentStr, displayPtr, configPtr );
            
            if( compareString( currentOpCode->opName, "allocate" ) == STR_EQ )
            {
                // attempt to allocate memory
                allocatedHead = allocateMemory( configPtr->memAvailable,
                                            allocatedHead, memBase, memOffset );
                
                // check if the memory was allocated
                if( allocatedHead == NULL )
                {
                    accessTimer( accessArgs );
                    sprintf( currentStr, 
                                "%10s, Process: %d, MMU failed to allocate\n",
                                       accessArgs->str, pcbPtr->processNumber );
                    displayPtr = displayStr( currentStr, displayPtr, 
                                                                    configPtr );
                    
                    // set the seg fault flag to true and break
                    segFault = True;
                    break;
                }
            }
            else
            {
                // attempt to access memory
                memAccessResult = accessMemory( allocatedHead, memBase,
                                                                    memOffset );
                
                // check if the memory was accessed
                if( memAccessResult != NO_ERR )
                {
                    accessTimer( accessArgs );
                    sprintf( currentStr,
                            "%10s, Process: %d, MMU failed to access\n", 
                                       accessArgs->str, pcbPtr->processNumber );
                    displayPtr = displayStr( currentStr, displayPtr,
                                                                    configPtr );
                    
                    // set the seg fault flag to true and break
                    segFault = True;
                    break;
                }
            }
            
            accessTimer( accessArgs );
            sprintf( currentStr, "%10s, Process: %d, MMU successful %s\n",
                                        accessArgs->str, pcbPtr->processNumber,
                                                        currentOpCode->opName );
            displayPtr = displayStr( currentStr, displayPtr, configPtr );
        }
        
        // increment to the next op code for the loop
        currentOpCode = currentOpCode->next;
    }
    
    sprintf( currentStr, "\n" );
    displayPtr = displayStr( currentStr, displayPtr, configPtr );
    
    // check if seg fault happened, if so display it
    if( segFault == True )
    {
        accessTimer( accessArgs );
        sprintf( currentStr, 
                        "%10s, OS: Process %d experiences segmentation fault\n",
                                       accessArgs->str, pcbPtr->processNumber );
        displayPtr = displayStr( currentStr, displayPtr, configPtr );
    }
    
    // set the pcb state to EXIT and display
    pcbPtr->processState = EXIT;
    
    accessTimer( accessArgs );
    sprintf( currentStr, "%10s, OS: Process %d ended and set in EXIT state\n",
                                       accessArgs->str, pcbPtr->processNumber );
    displayPtr = displayStr( currentStr, displayPtr, configPtr );
    
    // free the memory allocated during the process
    freeMemory( allocatedHead );
    
    return displayPtr;
}

/* Generates the header for the log file in the specified format
   using the config pointer.
*/
DisplayNode *generateLogFileHeader( ConfigDataType *configInfo )
{
    // initialize the display header and the string buffers used
    char *noFormatStr;
    char strBuffer[ 100 ];
    DisplayNode *localHeadPtr = NULL;
    
    noFormatStr = "\n==================================================\n";
    localHeadPtr = addDisplayNode( localHeadPtr, noFormatStr );
    
    noFormatStr = "Simulator Log File Header\n\n";
    localHeadPtr = addDisplayNode( localHeadPtr, noFormatStr );
    
    sprintf( strBuffer, "%-32s: %s\n", "File Name", 
                                        configInfo->metaDataFileName );
    localHeadPtr = addDisplayNode( localHeadPtr, strBuffer );
    
    sprintf( strBuffer, "%-32s: %s\n", "CPU Scheduling",
                                    getCpuSchedStr(configInfo->cpuSchedCode) );
    localHeadPtr = addDisplayNode( localHeadPtr, strBuffer );
    
    sprintf( strBuffer, "%-32s: %d\n", "Quantum Cycles",
                                                   configInfo->quantumCycles );
    localHeadPtr = addDisplayNode( localHeadPtr, strBuffer );
    
    sprintf( strBuffer, "%-32s: %ld\n", "Memory Available (KB)",
                                                    configInfo->memAvailable );
    localHeadPtr = addDisplayNode( localHeadPtr, strBuffer );
    
    sprintf( strBuffer, "%-32s: %d\n", "Processor Cycle Rate (ms/cycle)",
                                                   configInfo->procCycleRate );
    localHeadPtr = addDisplayNode( localHeadPtr, strBuffer );
    
    sprintf( strBuffer, "%-32s: %d\n", "I/O Cycle Rate",
                                                     configInfo->ioCycleRate );
    localHeadPtr = addDisplayNode( localHeadPtr, strBuffer );
    
    return localHeadPtr;
    
}

/* Handles display information. Checks if it is meant to display to the
   monitor, and prints if so. Also adds the string to a linked list
   for file logging if necessary.
*/
DisplayNode *displayStr( char *stringToDisplay, DisplayNode *displayHead,
                                                   ConfigDataType *configInfo )
{
    // get the logCode
    int logCode = configInfo->logToCode;
    
    // add the string to the linked list for logging purposes
    displayHead = addDisplayNode( displayHead, stringToDisplay );

    // check if it is meant to log to the screen
    if( (logCode == LOGTO_BOTH_CODE) || (logCode == LOGTO_MONITOR_CODE) )
    {
        printf( "%s", stringToDisplay );
    }
    
    return displayHead;
}

/* Adds a new node to the display linked list passed to it.
   Just takes in a string and creates a new node using that
   string for the field.
*/
DisplayNode *addDisplayNode( DisplayNode *localHead, char *nodeStr )
{
    // check if localHead is null
    if( localHead == NULL )
    {
        // make the localHead point to a new DisplayNode
        localHead = (DisplayNode *) malloc( sizeof( DisplayNode ) );
        
        // put the string into the new node, and make the next node null
        copyString( localHead->str, nodeStr );
        localHead->next = NULL;
        
        return localHead;
    }
    
    // send the string to be added to the next node in the list
    localHead->next = addDisplayNode( localHead->next, nodeStr );
    
    return localHead;
}

/* Translates the CPU sched code, which is an int due to enum. Turns it
   from int to string for use in the log header display
*/
char *getCpuSchedStr( int schedCode )
{
    // check what the sched code is equal to and return corresponding string
    switch( schedCode )
    {
        case CPU_SCHED_SJF_N_CODE:
            return "SJF-N";
        
        case CPU_SCHED_SRTF_P_CODE:
            return "SRTF-P";
        
        case CPU_SCHED_FCFS_P_CODE:
            return "FCFS-P";
        
        case CPU_SCHED_RR_P_CODE:
            return "RR-P";
        
        case CPU_SCHED_FCFS_N_CODE:
            return "FCFS-N";
    }
    
    // return default FCFS-N
    return "FCFS-N";
}

/* Logs the display head linked list to the file all at once. Goes through
   the linked list and writes it line by line to the file.
*/
int logToFile( DisplayNode *localDisplayHead, char *fileName, char *fileFlag )
{
    FILE *filePtr;
    
    // open the file
    filePtr = fopen( fileName, fileFlag );
    
    // make sure the file opened
    if( filePtr == NULL )
    {
        return FILE_OPEN_ERR;
    }
    
    // loop through the display list, writing line by line to file
    while( localDisplayHead != NULL )
    {
        fputs( localDisplayHead->str, filePtr );
        localDisplayHead = localDisplayHead->next;
    }
    
    // close the file
    fclose( filePtr );
    
    return NO_ERR;
}

/* Clears the display data using the head node
*/
DisplayNode *clearDisplayData( DisplayNode *localPtr )
{
    // check for local pointer not set to null (list not empty)
    if( localPtr != NULL )
    {
        // check for local pointer's next node not null
        if( localPtr->next != NULL )
        {
            // call recursive fuction with next pointer
                // function: clearMetaDataList
            clearDisplayData( localPtr->next );
        }
        
        // after recursive call, release memory to OS
            // function: free
        free( localPtr );
    }
    
    // return null to calling function
    return NULL;
}

/* Clears the pcb data using the head node
*/
PCB *clearPcbData( PCB *localPtr )
{
    // check for local pointer not set to null (list not empty)
    if( localPtr != NULL )
    {
        // check for local pointer's next node not null
        if( localPtr->nextPCB != NULL )
        {
            // call recursive fuction with next pointer
                // function: clearMetaDataList
            clearPcbData( localPtr->nextPCB );
        }
        
        // after recursive call, release memory to OS
            // function: free
        free( localPtr );
    }
    
    // return null to calling function
    return NULL;
}

/* Displays information about the passed error code. Used for error handling.
*/
void displaySimError( int errorCode )
{
    switch( errorCode )
    {
    case NO_SYSTEM_START_ERR:
        printf( "System start op code not found at start of metadata.\n" );
        printf( "Terminating program.\n\n" );
        break;
    case NO_SYSTEM_END_ERR:
        printf( "System end op code not found.\n" );
        printf( "Terminating program.\n\n" );
        break;
    case OP_CODE_OVERLAP_ERR:
        printf( "Op code start found before previous op code end.\n" );
        printf( "Terminating program.\n\n" );
        break;
    case FILE_OPEN_ERR:
        printf( "Log file could not be written.\n" );
        printf( "Terminating program.\n\n" );
        break;
    }
}

/* Checks to make sure the memory being allocated does not exceed the max
   amount allowed to the process. Then makes sure the memory block is not
   overlapping with an already allocated block. If no overlap, allocates
   the memory block and returns it
*/
MemoryBlock *allocateMemory( int maxMem, MemoryBlock *localHead, int newBase,
                                                                int newOffset )
{
    // calculate the max memory reached by the process
    int newMax = newBase + newOffset;
    
    // check if the new memory block exceeds the process limit
    if( newMax > maxMem )
    {
        return NULL;
    }
    
    // check if there is no allocated memory yet
    if( localHead == NULL )
    {
        return addMemoryBlock( localHead, newBase, newOffset );
    }
    // check if this new block is somewhere past the current head
    else if( newBase > localHead->max )
    {
        // check the new block details with the next allocated block
        localHead->next = allocateMemory( maxMem, localHead->next, newBase,
                                                                    newOffset );
        
        // check that the block was created or not; if not, return null
        if( localHead->next == NULL )
        {
            return NULL;
        }
        return localHead;
    }
    // return null if the block is anywhere within the current head block
    else if( ( newBase >= localHead->base ) || ( newMax > localHead->base ) )
    {
        return NULL;
    }
    else
    {
        return addMemoryBlock( localHead, newBase, newOffset );
    }
}

/* Creates a new memory block using the parameters passed to it. Assumes the
   parameters have already been checked for validity. Places the new block
   in front of the head passed to the method
*/
MemoryBlock *addMemoryBlock( MemoryBlock *localHead, int newBase,
                                                                int newOffset )
{
    // malloc a new memory block
    MemoryBlock *newBlock = ( MemoryBlock *) malloc( sizeof( MemoryBlock ) );
    
    // set the new block fields to the parameters passed
    newBlock->base = newBase;
    newBlock->max = newBase + newOffset;
    newBlock->next = localHead;
    
    return newBlock;
}

/* Attempts to access memory block using the parameters passed. Recursively
   checkseach allocated memory block until it finds the block, or does not.
   Returns failure if the block is not allocated fully, success otherwise
*/
int accessMemory( MemoryBlock *localHead, int base, int offset )
{
    // calculate the max memory value of the accessed block
    int accessMax = base + offset;
    
    // check if there is any allocated memory
    if( localHead == NULL )
    {
        return ACCESS_ERR;
    }
    
    // check if the new base comes after the current head block
    if( base >= localHead->max )
    {
        return accessMemory( localHead->next, base, offset );
    }
    // check if the base and max come within the current block
    else if( ( base < localHead->base ) || ( accessMax > localHead->max ) )
    {
        return ACCESS_ERR;
    }
    return NO_ERR;
}

/* Frees the memory blocks allocated during the process execution
*/
void freeMemory( MemoryBlock *localHead )
{
    if( localHead != NULL )
    {
        freeMemory( localHead->next );
        free( localHead );
    }
}

/* Checks if all of the PCB's have been executed or not. Checks to see
   if each state is in EXIT. If any are not, it returns False. Else it
   is True
*/
Boolean checkIfDone( PCB *pcbHeadPtr )
{
    if( pcbHeadPtr == NULL )
    {
        return True;
    }
    else if( pcbHeadPtr->processState != EXIT )
    {
        return False;
    }
    return checkIfDone( pcbHeadPtr->nextPCB );
}

/* Returns the next shortest job that has not yet been executed. Assumes
   at least one job has not been executed when called
*/
PCB *getShortestJob( PCB *pcbHeadPtr )
{
    PCB *currentShortest = NULL;
    while( pcbHeadPtr != NULL )
    {
        if( pcbHeadPtr->processState != EXIT )
        {
            if( ( currentShortest == NULL ) ||
                ( currentShortest->processTime > pcbHeadPtr->processTime ) )
            {
                currentShortest = pcbHeadPtr;
            }
        }
        pcbHeadPtr = pcbHeadPtr->nextPCB;
    }
    return currentShortest;
}

/*  Checks through the PCB list to find if any have the interrupt
    flag set to True; if so, it continues handling all interrupts
    it runs into and returns True
*/
Boolean checkForInterrupt( PCB *currentProc, PCB *pcbLocalHead,
                                                        TimerArgs *accessArgs )
{
    if( pcbLocalHead != NULL )
    {
        if( pcbLocalHead->interrupt == False )
        {
            return checkForInterrupt( currentProc, pcbLocalHead->nextPCB,
                                                                   accessArgs );
        }
        else
        {
            handleInterrupt( currentProc, pcbLocalHead, accessArgs );
            checkForInterrupt( NULL, pcbLocalHead->nextPCB, accessArgs );
            return True;
        }
    }
    return False;
}

/*  Handles interrupts when called; it is passed the PCB of the interrupt call,
    and it implies there is an interrupt
*/
void handleInterrupt( PCB *currentProc, PCB *pcbPtr, TimerArgs *accessArgs )
{
    // display interrupt message
    if( currentProc != NULL )
    {
        accessTimer( accessArgs );
        printf( "\n%10s, OS: Process %d interrupted by process %d\n",
                                  accessArgs->str, currentProc->processNumber,
                                                        pcbPtr->processNumber );
                                           
        currentProc->processState = READY;
        
        accessTimer( accessArgs );
        printf( "%10s, OS: Process %d set in READY state\n",
                                  accessArgs->str, currentProc->processNumber );
    }
    else
    {
        accessTimer( accessArgs );
        printf( "\n%10s, OS: Interrupt called by process %d\n",
                                       accessArgs->str, pcbPtr->processNumber );
    }
    
    // report end of thread op code
    accessTimer( accessArgs );
    printf( "\n%10s, Process: %d, %s input end\n",
                                    accessArgs->str, pcbPtr->processNumber,
                                                pcbPtr->startOpCode->opName );
                                           
    // get pcb back to ready state for the rest
    pcbPtr->startOpCode = pcbPtr->startOpCode->next;
    pcbPtr->processState = READY;
    
    accessTimer( accessArgs );
    printf( "\n%10s, OS: Process %d set in READY state\n",
                                       accessArgs->str, pcbPtr->processNumber );
}

