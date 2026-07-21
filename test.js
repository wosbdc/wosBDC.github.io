fetch('https://wosbdc.github.io/?t=' + Date.now())
  .then(r => r.text())
  .then(t => {
    const m = t.match(/assets\/index-[^\.]+\.js/);
    if (m) {
      fetch('https://wosbdc.github.io/' + m[0])
        .then(r => r.text())
        .then(js => console.log(js.includes('Event Goals (Showdown)') ? 'DEPLOYED' : 'NOT DEPLOYED'));
    } else {
      console.log('NO MATCH');
    }
  });
