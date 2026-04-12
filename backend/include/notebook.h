#ifndef NOTEBOOK_H
#define NOTEBOOK_H

#define MAX_CELLS 100
#define MAX_CODE_LENGTH 4096

#define MEMORY_DIRECTORY "memory/"
#define TEMP_FILENAME MEMORY_DIRECTORY "temp.c"
#define OUTPUT_FILENAME MEMORY_DIRECTORY "temp.out"

#define NOTEBOOK_DIRECTORY "examples/"
#define NOTEBOOK_FILENAME NOTEBOOK_DIRECTORY "notebook.cnb"

typedef struct {
    int id;
    char code[MAX_CODE_LENGTH];
    char output[MAX_CODE_LENGTH];
} Cell;

extern Cell notebook[MAX_CELLS];
extern int cell_count;

void run_cell(int cell_index);
void print_header(void);

#endif
