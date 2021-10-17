  copy = (clicked_id) => {
  event.preventDefault();
  input = document.createElement("input");
  input.style="position:absolute;opacity:0";
  input.value = window.location.origin + '/#' + clicked_id;
  document.body.append(input);
  input.select();
  document.execCommand("copy");
  input.remove();
}

function onClick(clicked_id)
	{
		var par = '-§-'
		var tip = 'Copied!'
		document.getElementById(clicked_id).innerHTML = tip;
		copy(clicked_id);

		setTimeout(function(){
			document.getElementById(clicked_id).innerHTML = par;
		}, 800);
	}
