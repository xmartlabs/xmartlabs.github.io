#!/bin/bash

stop_ship_files=$(grep -rli '<!--.*TODO.*-->\|<!--.*STOPSHIP.*-->\|<!--.*FIXME.*-->' _posts/*.md)
if [[ "$stop_ship_files" ]]; then
	echo "Forbidden comment found." 
	echo "Files: $stop_ship_files" 
    exit 1
fi
