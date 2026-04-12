#include "notebook.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/stat.h>
#include <sys/types.h>

#define CLEAR_SCREEN "\033[2J\033[H"
#define SET_COLOR_CYAN "\033[0;36m"
#define MEMORY_OUTPUT_FILE MEMORY_DIRECTORY "memory_output.txt"

Cell notebook[MAX_CELLS];
int cell_count = 0;

void print_header(void) {
    printf(CLEAR_SCREEN);
    printf(SET_COLOR_CYAN);
    printf("╔════════════════════════════════════════════════════════╗\n");
    printf("║              C Notebook Pure Terminal Mode            ║\n");
    printf("╠════════════════════════════════════════════════════════╣\n");
    printf("║ Commands: :save  :load  :exit                         ║\n");
    printf("╚════════════════════════════════════════════════════════╝\n");
    printf("Current cells: %d\n", cell_count);
}

void run_cell(int cell_index) {
    if (cell_index < 0 || cell_index >= MAX_CELLS) return;

    mkdir(MEMORY_DIRECTORY, 0755);

    FILE *file = fopen(TEMP_FILENAME, "w");
    if (!file) return;

    fprintf(file, "#include <stdio.h>\n");
    fprintf(file, "#include <stdlib.h>\n");
    fprintf(file, "#include <string.h>\n");
    fprintf(file, "#include <math.h>\n");
    fprintf(file, "int main() {\n");
    for (int current_cell = 0; current_cell <= cell_index; current_cell++) {
        fprintf(file, "%s\n", notebook[current_cell].code);
    }
    fprintf(file, "return 0; }\n");
    fclose(file);

    char command[512];
    snprintf(command, sizeof(command),
             "gcc %s -o %s -lm && ./%s > %s 2>&1",
             TEMP_FILENAME, OUTPUT_FILENAME, OUTPUT_FILENAME, MEMORY_OUTPUT_FILE);
    int result = system(command);

    notebook[cell_index].output[0] = '\0';

    FILE *out = fopen(MEMORY_OUTPUT_FILE, "r");
    if (out) {
        char line[MAX_CODE_LENGTH];
        while (fgets(line, sizeof(line), out)) {
            strncat(notebook[cell_index].output, line, MAX_CODE_LENGTH - strlen(notebook[cell_index].output) - 1);
        }
        fclose(out);
    }
    if (result != 0) {
        strncat(notebook[cell_index].output, "Compilation or execution error.\n", MAX_CODE_LENGTH - strlen(notebook[cell_index].output) - 1);
    }

    print_header();

    for (int show_cell = 0; show_cell <= cell_index; show_cell++) {
        printf("--- Cell %d ---\n", show_cell + 1);
        printf("%s\n", notebook[show_cell].code);
        printf("Output:\n%s\n", notebook[show_cell].output);
    }
}
