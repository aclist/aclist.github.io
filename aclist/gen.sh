#!/bin/bash
anchor="═§═"
title="AC compatibility list"
json=ac.json
sheet=style.css
native_count(){
	< $json jq '.native|length'
}
native_working(){
	< $json jq '[.native[]|select(.status=="Working")]|length'
}
wine_count(){
	< $json jq '.wine|length'
}
wine_working(){
	< $json jq '[.wine[]|select(.status=="Working")]|length'
}
meta(){
	cat <<- EOF
	<html lang="en">
	<head>
	<meta charset="UTF-8">
	<meta http-equiv="X-UA-Compatible" content="IE=edge">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<meta name="generator" content="Asciidoctor 2.0.16">
	<meta name="author" content="">
	<title>$title</title>
	<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Open+Sans:300,300italic,400,400italic,600,600italic%7CNoto+Serif:400,400italic,700,700italic%7CDroid+Sans+Mono:400,700">
	<link rel="stylesheet" href="sortable.min.css" />
	<link rel="stylesheet" href="$sheet">
	<script src="sortable.min.js"></script>
	<script src="copy.js"></script>
	</head>
	EOF
}
preamble(){
	cat <<- EOF
	<body class="article">
	<div id="header">
	<h1>$title</h1>
	<div class="details">
	<span id="author" class="author">Last updated: $(date +%F)</span><br>
	</div>
	</div>
	<div id="content">
	<div id="preamble">
	<div class="sectionbody">
	<p>This list tracks games officially working and actively supported with AC out of the box. Speculative compatibility reports are excluded.
	To the extent possible, all entries are verified with the game developers and independently tested by the maintainer of the site.</p>
	<div class="ulist">
	<ul>
	<li>
	<p><a href="#_native">Native ($(native_working)/$(native_count))</a></p>
	</li>
	<li>
	<p><a href="#_wine">Wine/Proton ($(wine_working)/$(wine_count))</a></p>
	</li>
	</ul>
	<form method="GET" action="https://github.com/aclist/aclist.github.io/issues">
	<input type="submit" value="Submit report" id="issue-button">
	</form>
	<div id="infotable">
	<p>- Table columns can be sorted by clicking headers</p>
	<p>- Click <code>═§═</code> to copy direct record link to clipboard</p>
	<p>- Games with a passing (working) status receive a link to the game's page</p>
	</div>
	</div>
	</div>
	</div>
	EOF
}
sharelink(){
	cat <<- EOF
	<td class="tableblock halign-left valign-top" style="background-color: white;"><p class="tableblock"><a class="sharelink" id="$1" onClick="onClick(this.id)">$anchor</a></td>
	EOF
}
header(){
	cat <<- EOF
	<th class="tableblock halign-left valign-top header-row">$1</th>
	EOF
}
open_table(){
	cat <<- EOF
	<div style="overflow-x:auto">
	<table class="tableblock frame-all grid-all">
	<colgroup>
	<col style="width: $1%;">
	<col style="width: $2%;">
	</colgroup>
	<thead>
	<tr>
	<th class="tableblock halign-left valign-top">Code</th>
	<th class="tableblock halign-left valign-top">Meaning</th>
	</tr>
	</thead>
	<tbody>
	EOF
}
ac(){
	cat <<- EOF
	<tr>
	<td class="tableblock halign-left valign-top"><p class="tableblock">$1</p></td>
	<td class="tableblock halign-left valign-top"><p class="tableblock">$2</p></td>
	</tr>
	EOF
}
close_header(){
	cat <<- EOF
	</thead>
	EOF

}
close_table(){
	cat <<- EOF
	</tbody>
	</table>
	</div>
	EOF
}
open_header(){
	cat <<- EOF
	<div style="overflow-x:auto">
	<table class="tableblock frame-all grid-all stretch sortable">
	<colgroup>
	<col style="width: 5%;">
	<col style="width: 25%;">
	<col style="width: 5%;">
	<col style="width: 35%;">
	</colgroup>
	<thead>
	EOF
}
print_header(){
	echo "<tr>"
	for i in "Direct Link" Game AC Status; do
		header "$i"
	done
	echo "</tr>"
	echo "</thead>"
}
section_header(){
	cat <<- EOF
	<div class="sect3">
	<h4 id="_$1">$2</h4>
	EOF
}
notes(){
	readarray -t remarks < <(< $json jq -r --arg platform $2 --arg name $1 '.[$platform][]|select(.shortname==$name).notes[]' 2>/dev/null)
	if [[ ${#remarks[@]} -gt 0 ]]; then

		cat <<- EOF
		<tr>
		<td class="tableblock halign-left valign-top notes">
		<td class="tableblock halign-left valign-top notes" colspan=4>
		EOF
		for((i=0;i<${#remarks[@]};i++)); do
			remarks_markup=$(sed 's/\(http.*$\)/<a href="\1">\1<\/a>/' <<< "${remarks[$i]}")
			cat <<- EOF
			<p class="tableblock-notes">$((i+1)). $remarks_markup</p>
			EOF
		done
		cat <<- EOF
		</td>
		</tr>
		EOF
	fi
}
record(){
	url="https://store.steampowered.com/app/$2"
	case $5 in
		Working) statuscol=working;
			if [[ $2 == "null" ]]; then
				str="$3"
			else
				str="<a href=\"$url\">$3</a>"
			fi
			;;
		Broken) statuscol=broken;
		       str="$3" ;;
		Shut*) statuscol=offline;
			str="$3" ;;
		Unknown) statuscol=unknown;
			str="$3"
	esac
	cat <<- EOF
	<tr>
	<td class="tableblock halign-left valign-top blank"><p class="tableblock"><a class="sharelink" id=$1 onClick="onClick(this.id)">$anchor</a></td>
	<td class="tableblock halign-left valign-top blank"><p class="tableblock">${str}</p></td>
	<td class="tableblock halign-left valign-top blank"><p class="tableblock">$4</p></td>
	<td class="tableblock halign-left valign-top $statuscol"><p class="tableblock">$5</p></td>
	</tr>
	EOF
	notes $1 $6
}
open_notes(){
	cat <<- EOF
	<tr>
	<td class="tableblock halign-left valign-top header-row" colspan=4>
	EOF
}
close_notes(){
	cat <<- EOF
	</td>
	</tr>
	EOF
}
end_table(){
	cat <<- EOF
	</table>
	</div>
	</div>
	</div>
	</body>
	</html>
	EOF
}
add_records(){
while IFS=$'\t' read shortname appid name ac status; do
	record $shortname $appid "$name" "$ac" "$status" $1
done < <(< $json jq -r --arg platform $1 '.[$platform][]|"\(.shortname)\t\(.appid)\t\(.name)\t\(.ac)\t\(.status)"')
}
print_codes(){
	while read code name; do
		ac $code "$name"
	done< <(< ac.json jq -r --arg platform $1 '.[$platform][]|"\(.code) \(.name)"')
}
main(){
	meta
	preamble
	section_header native Native
	open_table 15 65
	print_codes native_ac
	close_header
	open_header
	print_header
	echo "<tbody>"
	add_records native
	close_table
	echo "</div>"
	section_header wine Wine/Proton
	open_table 10 30
	print_codes wine_ac
	close_table
	open_header
	print_header
	add_records wine
	close_table
	echo "</body>"
	echo "</html>"
}
main
