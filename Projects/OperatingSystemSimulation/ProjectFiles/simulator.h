// Pre-compiler directive
#ifndef SIMULATOR_H
#define SIMULATOR_H

// header files
#include "StringUtils.h"
#include "ConfigAccess.h"
#include "MetaDataAccess.h"
#include "simtimer.h"
#include <stdio.h>
#include <pthread.h>

// global constants
typedef enum { NEW,
               READY,
               RUNNING,
               BLOCKED,
               EXIT, } status;
               
typedef enum { NO_SYSTEM_START_ERR,
               NO_SYSTEM_END_ERR,
               OP_CODE_OVERLAP_ERR,
               FILE_OPEN_ERR,
               ACCESS_ERR, } error;
               
// pcb data structure
typedef struct PCB
{
    int processNumber;
    int processState;
    int processTime;
    OpCodeType *startOpCode;
    Boolean interrupt;
    
    struct PCB *nextPCB;
} PCB;

// display data structure
typedef struct DisplayNode
{
    char str[ 100 ];
    
    struct DisplayNode *next;
} DisplayNode;

// timer argument structure
typedef struct TimerArgs
{
    int flag;
    char str[ 40 ];
} TimerArgs;

// memory block structure
typedef struct MemoryBlock
{
    int base;
    int max;
    
    struct MemoryBlock *next;
} MemoryBlock;

// function prototypes
int runSimulator( ConfigDataType *configDataPtr, OpCodeType *mdDataHead );
int setProcesses( ConfigDataType *configDataPtr, OpCodeType *mdDataHead,
                                                                PCB **pcbHead );
PCB *addPcbNode( PCB *localHead, PCB *newNode );
int cycleConvert( ConfigDataType *configInfo, OpCodeType *opCode );
void setToReady( PCB *pcbHead );
DisplayNode *runProcess( ConfigDataType *configPtr, PCB *pcbPtr,
                               DisplayNode *displayPtr, TimerArgs *accessArgs );
DisplayNode *generateLogFileHeader( ConfigDataType *configInfo );
DisplayNode *displayStr( char *stringToDisplay, DisplayNode *displayHead,
                                                   ConfigDataType *configInfo );
DisplayNode *addDisplayNode( DisplayNode *localHead, char *nodeStr );
char *getCpuSchedStr( int schedCode );
int logToFile( DisplayNode *localDisplayHead, char *fileName, char *fileFlag );
DisplayNode *clearDisplayData( DisplayNode *localPtr );
PCB *clearPcbData( PCB *localPtr );
void displaySimError( int errorCode );
MemoryBlock *allocateMemory( int maxMem, MemoryBlock *localHead, int newBase,
                                                               int newOffset );
MemoryBlock *addMemoryBlock( MemoryBlock *localHead, int newBase,
                                                               int newOffset );
int accessMemory( MemoryBlock *localHead, int base, int offset );
void freeMemory( MemoryBlock *localHead );
Boolean checkIfDone( PCB *pcbHeadPtr );
PCB *getShortestJob( PCB *pcbHeadPtr );

Boolean checkForInterrupt( PCB *currentProc, PCB *pcbLocalHead, TimerArgs *accessArgs );
void handleInterrupt( PCB *currentProc, PCB *pcbPtr, TimerArgs *accessArgs );

#endif // SIMULATOR_H
