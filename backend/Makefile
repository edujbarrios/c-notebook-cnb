CC = gcc
CFLAGS = -Wall -Iinclude
SRC = src/main.c src/notebook.c src/notebook_cnb.c

all: cnb

cnb: $(SRC)
	$(CC) $(CFLAGS) -o $@ $^

clean:
	rm -f cnb temp.c temp.out output.txt
