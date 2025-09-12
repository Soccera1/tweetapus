const pages = {
	timeline: document.querySelector(".timeline"),
	tweet: document.querySelector(".tweet"),
};

export default function switchPage(page) {
	Object.values(pages).forEach((p) => {
		p.style.display = "none";
	});

	pages[page].style.display = "flex";

	return pages[page];
}
