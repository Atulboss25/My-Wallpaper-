function loadCategory(category) {
  fetch(`/api/wallpapers/${category}`)
    .then(res => res.json())
    .then(data => {
      const gallery = document.getElementById("gallery");
      gallery.innerHTML = "";
      data.forEach(img => {
        gallery.innerHTML += `
          <a href="${img}" download>
            <img src="${img}">
          </a>`;
      });
    });
}
