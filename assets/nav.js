class AppNav extends HTMLElement {
  connectedCallback() {
    const active = this.getAttribute('active') || 'beranda';
    const tabs = [
      { id: 'beranda',    href: 'index.html',      label: 'Home' },
      { id: 'kosakata',   href: 'kosakata.html',   label: 'Vocabulary' },
      { id: 'tatabahasa', href: 'tatabahasa.html', label: 'Grammar' },
      { id: 'kuis',       href: 'kuis.html',       label: 'Quiz' },
      { id: 'pelafalan',  href: 'pelafalan.html',  label: 'Pronunciation' },
      { id: 'ai',         href: 'tanya-ai.html',   label: 'Ask AI' }
    ];
    const links = tabs.map(t => {
      const isOn = t.id === active;
      return '<a class="tab' + (isOn ? ' active' : '') + '" href="' + t.href + '" aria-current="' + (isOn ? 'page' : 'false') + '">' + t.label + '</a>';
    }).join('\n      ');
    this.innerHTML = '\n    <nav aria-label="Main Navigation">\n      ' + links + '\n    </nav>\n  ';
  }
}
customElements.define('app-nav', AppNav);
