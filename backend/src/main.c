#include "notebook.h"
#include "notebook_cnb.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/stat.h>
#include <sys/types.h>

#define SET_COLOR_RESET "\033[0m"
#define OUTPUT_DIRECTORY "output_cnbs/"

int main() {
    mkdir(NOTEBOOK_DIRECTORY, 0755);
    mkdir(OUTPUT_DIRECTORY, 0755);

    char input[MAX_CODE_LENGTH];
    char filename[256] = {0};

    while (1) {
        print_header();
        printf("Enter code for cell %d (finish with :end):\n", cell_count + 1);

        notebook[cell_count].code[0] = '\0';
        while (fgets(input, sizeof(input), stdin)) {
            if (strcmp(input, ":end\n") == 0) break;
            if (strncmp(input, ":exit", 5) == 0) {
                printf(SET_COLOR_RESET);
                return 0;
            }
            if (strncmp(input, ":save", 5) == 0) {
                printf("Enter filename to save (max 240 chars, without extension): ");
                if (!fgets(filename, sizeof(filename), stdin)) continue;
                filename[strcspn(filename, "\n")] = 0;
                char full_filename[MAX_CODE_LENGTH];
                snprintf(full_filename, sizeof(full_filename), "%s%.240s.cnb", OUTPUT_DIRECTORY, filename);
                save_notebook_file(full_filename);
                printf("Notebook saved as '%s'. Press ENTER to continue.\n", full_filename);
                getchar();
                continue;
            }
            if (strncmp(input, ":load", 5) == 0) {
                load_notebook_file(NOTEBOOK_FILENAME);
                printf("Notebook loaded. Press ENTER to continue.\n");
                getchar();
                continue;
            }
            strncat(notebook[cell_count].code, input, MAX_CODE_LENGTH - strlen(notebook[cell_count].code) - 1);
        }

        if (cell_count < MAX_CELLS) {
            run_cell(cell_count);
            cell_count++;
        } else {
            printf("Maximum number of cells reached.\n");
        }
        printf("Press ENTER to continue.\n");
        getchar();
    }
    printf(SET_COLOR_RESET);
    return 0;
}
