#!/bin/bash

for file in _posts/*.md ; do
	post_date_string=$(grep -Po 'date:(.*)' "$file"  | head -1 | awk -F ' ' '{print $2}' | tr -d \' ) 
	post_date=$(date -d $post_date_string +%s)
	now_date=$(date +%s)

	# Display future posts
	if [ $post_date -ge $now_date ]; then
		sed -i 's/date: .*/date: '"$(date '+%Y-%m-%d')"' 00:00:00/g' "$file"
	fi

	# Display hidden posts
	sed -i 's/show: false/show: true/g' "$file"
done
