(function () {
  var cfg = window.VISOR;
  var pagesEl = document.getElementById("pages");
  var statusEl = document.getElementById("status");
  function fail() {
    statusEl.innerHTML = 'No se pudo mostrar el documento en esta página.<br><a href="' + cfg.pdf + '">Abrir el PDF</a>';
  }
  if (!window.pdfjsLib) { fail(); return; }
  pdfjsLib.GlobalWorkerOptions.workerSrc = "../visor/pdfjs/pdf.worker.min.js";
  pdfjsLib.getDocument({ url: cfg.pdf }).promise.then(function (pdf) {
    statusEl.remove();
    var dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    var items = [];
    var jobs = [];
    for (var n = 1; n <= pdf.numPages; n++) {
      var box = document.createElement("div");
      box.className = "page"; box.dataset.n = n;
      box.style.aspectRatio = "210 / 297";
      box.innerHTML = '<div class="ph">' + n + " / " + pdf.numPages + "</div>";
      pagesEl.appendChild(box); items.push(box);
    }
    function render(box) {
      if (box.dataset.done) return; box.dataset.done = "1";
      pdf.getPage(+box.dataset.n).then(function (page) {
        var w = box.clientWidth || 360;
        var base = page.getViewport({ scale: 1 });
        var vp = page.getViewport({ scale: (w / base.width) * dpr });
        box.style.aspectRatio = base.width + " / " + base.height;
        var c = document.createElement("canvas");
        c.width = Math.floor(vp.width); c.height = Math.floor(vp.height);
        return page.render({ canvasContext: c.getContext("2d"), viewport: vp }).promise.then(function () {
          box.innerHTML = ""; box.appendChild(c);
        });
      });
    }
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { render(e.target); io.unobserve(e.target); } });
      }, { rootMargin: "800px 0px" });
      items.forEach(function (b) { io.observe(b); });
    } else items.forEach(render);
  }).catch(fail);
})();
