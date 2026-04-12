#include "notebook_cnb.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

void save_notebook_file(const char *filename) {
    if (!filename) return;
    FILE *file = fopen(filename, "w");
    if (!file) return;
    fprintf(file, "CNOTEBOOK\n");
    fprintf(file, "CELLS:%d\n", cell_count);
    for (int cell_index = 0; cell_index < cell_count; cell_index++) {
        fprintf(file, "---\n%s\n<<<\n%s\n---\n", notebook[cell_index].code, notebook[cell_index].output);
    }
    fclose(file);
}

void load_notebook_file(const char *filename) {
    if (!filename) return;
    FILE *file = fopen(filename, "r");
    if (!file) return;
    char line[MAX_CODE_LENGTH];
    fgets(line, sizeof(line), file);
    if (strncmp(line, "CNOTEBOOK", 9) != 0) {
        fclose(file);
        return;
    }
    fgets(line, sizeof(line), file);
    sscanf(line, "CELLS:%d", &cell_count);
    for (int cell_index = 0; cell_index < cell_count; cell_index++) {
        fgets(line, sizeof(line), file);
        if (strncmp(line, "---", 3) != 0) break;
        notebook[cell_index].id = cell_index;
        notebook[cell_index].code[0] = '\0';
        notebook[cell_index].output[0] = '\0';
        while (fgets(line, sizeof(line), file)) {
            if (strncmp(line, "<<<", 3) == 0) break;
            strncat(notebook[cell_index].code, line,
                    MAX_CODE_LENGTH - strlen(notebook[cell_index].code) - 1);
        }
        while (fgets(line, sizeof(line), file)) {
            if (strncmp(line, "---", 3) == 0) break;
            strncat(notebook[cell_index].output, line,
                    MAX_CODE_LENGTH - strlen(notebook[cell_index].output) - 1);
        }
    }
    fclose(file);
}

