#include <stdlib.h>
#include <unistd.h>
#include <stdio.h>
#include <string.h>
#include <math.h>
#include "omp.h"
#include <iostream>

//See values of N in assignment instructions.
#define N 100000
//Do not change the seed, or your answer will not be correct
#define SEED 72

//For GPU implementation
#define BLOCKSIZE 1024

using namespace std;

struct pointData{
double x;
double y;
};


void generateDataset(struct pointData * data);
__global__ void distanceCalc( struct pointData * data, unsigned int * count, double * epsilon );


int main(int argc, char *argv[])
{
	//Read epsilon distance from command line
	if (argc!=2)
	{
		printf("\nIncorrect number of input parameters. Please input an epsilon distance.\n");
		return 0;
	}
	
	
	char inputEpsilon[20];
	strcpy(inputEpsilon,argv[1]);
	double epsilon=atof(inputEpsilon);
	
	

	//generate dataset:
	struct pointData * data;
	data=(struct pointData*)malloc(sizeof(struct pointData)*N);
	printf("\nSize of dataset (MiB): %f",(2.0*sizeof(double)*N*1.0)/(1024.0*1024.0));
	generateDataset(data);


	omp_set_num_threads(1);


	double tstart=omp_get_wtime();

	cudaError_t errCode = cudaSuccess;

	if( errCode != cudaSuccess )
	{
		cout << "\nLast error: " << errCode << endl;
	}
	
	struct pointData * dev_data;
	unsigned int * count;
	unsigned int * dev_count;
	double * dev_epsilon;

	count = (unsigned int *)malloc(sizeof(unsigned int));
	dev_count = (unsigned int *)malloc(sizeof(unsigned int));
	*count = N;

	dev_epsilon = (double *)malloc(sizeof(double));

	// allocate data on device
	errCode = cudaMalloc((struct pointData **)&dev_data, sizeof(struct pointData)*N);
	if( errCode != cudaSuccess )
	{
		cout << "\nError: dev_data allocation error with code " << errCode << endl;
	}

	errCode = cudaMalloc((unsigned int **)&dev_count, sizeof(unsigned int));
	if( errCode != cudaSuccess )
	{
		cout << "\nError: dev_count allocation error with code " << errCode << endl;
	}

	errCode = cudaMalloc((double **)&dev_epsilon, sizeof(double));
        if( errCode != cudaSuccess )
        {
                cout << "\nError: dev_epsilon allocation error with code " << errCode << endl;
        }

	// copy data over to the device
	errCode = cudaMemcpy( dev_data, data, sizeof(struct pointData)*N, cudaMemcpyHostToDevice );
	if( errCode != cudaSuccess )
	{
		cout << "\nError: dev_data copy in error with code " << errCode << endl;
	}

	errCode = cudaMemcpy( dev_count, count, sizeof(unsigned int), cudaMemcpyHostToDevice );
	if( errCode != cudaSuccess )
	{
		cout << "\nError: dev_count copy in error with code " << errCode << endl;
	}

	errCode = cudaMemcpy( dev_epsilon, &epsilon, sizeof(double), cudaMemcpyHostToDevice );
        if( errCode != cudaSuccess )
        {
                cout << "\nError: dev_epsilon copy in error with code " << errCode << endl;
        }


	// calculate blocks
	const unsigned int totalBlocks = ceil(N*1.0/BLOCKSIZE);


	// execute kernel
	double tkstart = omp_get_wtime();
	distanceCalc<<<totalBlocks, BLOCKSIZE>>>(dev_data, dev_count, dev_epsilon);

	cudaDeviceSynchronize();
	if( errCode != cudaSuccess )
	{
		cout << "\nErrorafter kernel launch " << errCode << endl;
	}

	double tkend = omp_get_wtime();

	// transfer count back to host
	errCode = cudaMemcpy( count, dev_count, sizeof(unsigned int), cudaMemcpyDeviceToHost );
	if( errCode != cudaSuccess )
	{
		cout << "\nError: dev_count copy out error with code " << errCode << endl;
	}

	printf("\nTotal count: %d", *count);

	double tend=omp_get_wtime();
	
	printf("\nTotal time (s): %f",tend-tstart);
	printf("\nKernel time (s): %f\n",tkend-tkstart);


	free(data);
	printf("\n");
	return 0;
}


//Generates the dataset using the given seed defined at the top
void generateDataset(struct pointData * data)
{

	//seed RNG
	srand(SEED);


	for (unsigned int i=0; i<N; i++){
		data[i].x=1000.0*((double)(rand()) / RAND_MAX);	
		data[i].y=1000.0*((double)(rand()) / RAND_MAX);	
	}
	

}

//Gets called by each thread to handle the data being passed to each specific thread
__global__ void distanceCalc( struct pointData * data, unsigned int * count, double * epsilon )
{
	unsigned int tid = threadIdx.x + (blockIdx.x * blockDim.x);

	if( tid >= N )
	{
		return;
	}

	unsigned int index;
	double xDiff, yDiff, distance;

	for( index = tid+1; index < N; index++ )
	{
		xDiff = data[tid].x - data[index].x;
		yDiff = data[tid].y - data[index].y;
		distance = sqrt( (xDiff * xDiff) + (yDiff * yDiff) );
		if( distance <= (*epsilon) )
		{
			atomicAdd( count, int(2) );
		}
	}
	return;
}
