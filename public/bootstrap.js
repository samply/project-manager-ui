// Starts the app in standalone mode (public/index.html). In the integrated
// mode, the single-spa root config registers the app instead.
// A file instead of an inline script, so the Content-Security-Policy can
// forbid inline scripts.
System.import('single-spa').then(function (singleSpa) {
  singleSpa.registerApplication({
    name: 'project-manager-ui',
    app: function () {
      return System.import('project-manager-ui');
    },
    activeWhen: ['/'],
  });
  singleSpa.start({urlRerouteOnly: true});
});
