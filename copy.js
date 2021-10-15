onClick = (event, text) => {

  event.preventDefault();
  input = document.createElement("input");
  input.style="position:absolute;opacity:0";
  input.value = text;
  document.body.append(input);
  input.select();
  document.execCommand("copy");
  input.remove();
}
