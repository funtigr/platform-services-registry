const navigation = {
  main: [
    { name: "Home", href: "#" },
    { name: "Disclamer", href: "#" },
    { name: "Privacy", href: "#" },
    { name: "Accessibility", href: "#" },
    { name: "Copyright", href: "#" },
    { name: "Contact Us", href: "#" },
    { name: "Report a bug/Request a feature", href: "#" }
  ]
};

export default function Example() {
  return (
    <footer className="bg-bcblue">
      <div className="mx-auto max-w-7xl overflow-hidden px-6 py-5 lg:px-8">
        <nav
          className="-mb-6 columns-2 sm:flex sm:justify-center sm:space-x-12"
          aria-label="Footer"
        >
          {navigation.main.map((item) => (
            <div key={item.name} className="pb-6">
              <a
                href={item.href}
                className="font-bcsans underline text-sm leading-6 text-white hover:text-bcgray"
              >
                {item.name}
              </a>
            </div>
          ))}
        </nav>
      </div>
    </footer>
  );
}
