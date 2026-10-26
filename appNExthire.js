(() => {
  const KEY = "nexthire-bitacora-v1";
  const $ = id => document.getElementById(id);
  const hoy = () => new Date().toISOString().slice(0, 10);
  const semilla = [
    { id: 1, fecha: "2026-10-20", autor: "Violeta Franco", tipo: "Avance", titulo: "Entrega del informe de la 2ª etapa",
      texto: "Se entregó el informe de avance. El maquetado HTML de las páginas principales está en desarrollo; registro, publicación y búsqueda de ofertas siguen pendientes.", codigo: "" },
    { id: 2, fecha: "2026-10-20", autor: "Adriana Ocampos", tipo: "Código con IA", titulo: "Uso de ChatGPT y Claude en el maquetado",
      texto: "Parte del código HTML y CSS se generó y optimizó con IA y fue validado manualmente por el equipo.", codigo: "" },
    { id: 3, fecha: "2026-10-20", autor: "Violeta Franco", tipo: "Aprendizaje", titulo: "Mejoras para la próxima etapa",
      texto: "Fijar una reunión semanal, definir backend y base de datos, y crear el repositorio en GitHub.", codigo: "" }
  ];
  let datos, editando = null;
  try { datos = JSON.parse(localStorage.getItem(KEY)) || semilla; } catch (e) { datos = semilla; }
  const guardar = () => { try { localStorage.setItem(KEY, JSON.stringify(datos)); } catch (e) { alert("No se pudo guardar en este navegador. Usá Exportar para conservar tus entradas."); } };

  const form = $("form-entrada");
  $("f-fecha").value = hoy();

  const esc = s => s.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const fmt = f => new Date(f + "T12:00:00").toLocaleDateString("es-PY", { day: "numeric", month: "long", year: "numeric" });
  const clase = t => "t-" + t.toLowerCase().replace(/\s+/g, "-");

  function render() {
    const q = $("buscar").value.toLowerCase(), t = $("filtro").value;
    const lista = datos.filter(e => (!t || e.tipo === t) &&
      (!q || [e.titulo, e.texto, e.autor, e.codigo].join(" ").toLowerCase().includes(q)))
      .sort((a, b) => b.fecha.localeCompare(a.fecha) || b.id - a.id);
    $("contador").textContent = datos.length + (datos.length === 1 ? " entrada" : " entradas") + (lista.length !== datos.length ? ", " + lista.length + " coinciden" : "");
    $("lista").innerHTML = lista.length ? lista.map(e => `
      <article class="entrada ${clase(e.tipo)}">
        <header><span class="fecha">${fmt(e.fecha)}</span><span class="etiqueta">${esc(e.tipo)}</span><span class="autor">${esc(e.autor)}</span></header>
        <h3>${esc(e.titulo)}</h3><p>${esc(e.texto)}</p>
        ${e.codigo ? `<pre><code>${esc(e.codigo)}</code></pre>` : ""}
        <div class="acciones"><button type="button" data-ed="${e.id}">Editar</button><button type="button" data-del="${e.id}">Borrar</button></div>
      </article>`).join("") : `<p class="vacio">No hay entradas que mostrar. Escribí la primera arriba.</p>`;
  }

  form.addEventListener("submit", ev => {
    ev.preventDefault();
    const e = { id: editando || Date.now(), fecha: $("f-fecha").value, autor: $("f-autor").value, tipo: $("f-tipo").value,
      titulo: $("f-titulo").value.trim(), texto: $("f-texto").value.trim(), codigo: $("f-codigo").value.trim() };
    datos = editando ? datos.map(x => x.id === editando ? e : x) : [e, ...datos];
    guardar(); salirEdicion(); render();
  });

  function salirEdicion() {
    editando = null; form.reset(); $("f-fecha").value = hoy();
    $("btn-guardar").textContent = "Guardar entrada"; $("btn-cancelar").hidden = true;
  }
  $("btn-cancelar").onclick = salirEdicion;

  $("lista").addEventListener("click", ev => {
    const d = ev.target.dataset;
    if (d.del && confirm("¿Borrar esta entrada? No se puede deshacer.")) { datos = datos.filter(x => x.id != d.del); guardar(); render(); }
    if (d.ed) {
      const e = datos.find(x => x.id == d.ed); editando = e.id;
      $("f-fecha").value = e.fecha; $("f-autor").value = e.autor; $("f-tipo").value = e.tipo;
      $("f-titulo").value = e.titulo; $("f-texto").value = e.texto; $("f-codigo").value = e.codigo;
      $("btn-guardar").textContent = "Guardar cambios"; $("btn-cancelar").hidden = false;
      form.scrollIntoView({ behavior: "smooth", block: "center" }); $("f-titulo").focus();
    }
  });
  $("buscar").oninput = render; $("filtro").onchange = render;

  $("btn-exportar").onclick = () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(datos, null, 2)], { type: "application/json" }));
    a.download = "bitacora-nexthire-" + hoy() + ".json"; a.click(); URL.revokeObjectURL(a.href);
  };
  $("btn-importar").onchange = ev => {
    const f = ev.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const nuevos = JSON.parse(r.result);
        if (!Array.isArray(nuevos)) throw 0;
        const ids = new Set(datos.map(x => x.id));
        datos = datos.concat(nuevos.filter(x => x && x.titulo && x.fecha && !ids.has(x.id)));
        guardar(); render();
      } catch (e) { alert("El archivo no es una bitácora válida. Elegí un .json exportado desde este cuaderno."); }
    };
    r.readAsText(f); ev.target.value = "";
  };
  render();
})();
