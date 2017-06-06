var rs_ctrl = (function () {

  var filter, _filter;
  var view = document.getElementById('view');
  var input = document.getElementById('input');
  var serv_id = document.getElementById('server_id');
  var max_rslt = document.getElementById('max_res');
  var match_count = document.getElementById('match_count');
  var help = document.getElementById('help');

  var update_rs = (rs) => {
    input.disabled = true;
    serv_id.disabled = true;
    max_rslt.disabled = true;
    fetch_data(rs.url).then(r => {
      rs.data = r;
      rs.loaded = true;
      serv_id.disabled = false;
      max_rslt.disabled = false;
      input.disabled = false;
      update_view();
    });
  };

  input.addEventListener('keydown', e => { 
    match_count.className = 'match_count'; 
    input.className = ''; 
    if(e.keyCode == 13) rs_ctrl.update_view() 
  });
  max_rslt.addEventListener('keydown', e => { if(e.keyCode == 13) rs_ctrl.update_view() });

  String.prototype.netOf = function(ip) { return ipaddr.parse(ip).match(ipaddr.parseCIDR(this.toString())); };

  var router_servers = [
    { name: 'Hurricane Electric HK (IPv6)',
      url: 'http://123.103.252.145/routes.json',
      data: [],
      id: 0,
      ipv6: true,
      loaded: false
    },
    { name: 'Hurricane Electric NY (IPv6)',
      url: 'http://141.193.21.3/routes6_he.json',
      data: [],
      id: 1,
      ipv6: true,
      loaded: false,
      disabled: true
    },
    { name: 'Choopa JP (IPv6)',
      url: 'http://141.193.21.2/routes6.json', 
      data: [],
      id: 2,
      ipv6: true,
      loaded: false
    },
    { name: 'Choopa JP (IPv4)',
      url: 'http://141.193.21.2/routes.json',
      data: [],
      id: 3,
      ipv6: false,
      loaded: false
    },
    { name: 'Internap JP (IPv4)',
      url: 'http://141.193.21.1/routes.json',
      data: [],
      id: 4,
      ipv6: false,
      loaded: false,
      disabled: true
    },
    { name: 'Internap JP (IPv6)',
      url: 'http://141.193.21.1/routes6.json',
      data: [],
      id: 5,
      ipv6: true,
      loaded: false,
      disabled: true
    },
    { name: 'Devcapsule UK (IPv4)',
      url: 'http://141.193.21.4/routes6.json',
      data: [],
      id: 6,
      ipv6: false,
      loaded: false,
      disabled: true
    },
    { name: 'Devcapsule UK (IPv6)',
      url: 'http://141.193.21.4/routes6.json',
      data: [],
      id: 7,
      ipv6: true,
      loaded: false,
      disabled: true
    },
    { name: 'Choopa NY (IPv6)',
      url: 'http://141.193.21.3/routes6.json',
      data: [],
      id: 8,
      ipv6: true,
      loaded: false,
      disabled: true
    },
    { name: 'Choopa NY (IPv4)',
      url: 'http://141.193.21.3/routes.json',
      data: [],
      id: 9,
      ipv6: false,
      loaded: false,
      disabled: true
    }
  ];

  var fetch_data = url => new Promise((res, rej) => {
    var pbar = document.getElementById('progress');
    pbar.style.backgroundColor = '#444';
    pbar.style.transition = '1s ease';
    var xhr = new XMLHttpRequest()
    var pcnt = 1;
    xhr.open('GET', url);
    xhr.onload = function () {
      if (this.status == 200) {
        pbar.style.width = '100%';
        pbar.style.transition = '.1s ease';
        window.setTimeout(() => { pbar.style.width = '0'; }, 250);
        res(JSON.parse(xhr.response).filter(r => r.as_path));
      } else rej(xhr.statusText);
    };
    xhr.onerror = err => rej(err);
    xhr.onprogress = e => {
      if (pcnt < 90) pcnt+=3;
      pbar.style.width = pcnt + '%';
    };
    xhr.send();
  });

  router_servers.forEach(rs => {
    var sel = document.createElement('option');
    sel.setAttribute('value', rs.id);
    sel.innerHTML = rs.name;
    if (rs.disabled) sel.disabled = true;
    serv_id.appendChild(sel);
  });

  var get_routes = server_id => {
    var rs = router_servers[server_id];
    if (!rs.loaded) update_rs(router_servers[server_id]);
    try {
      var rs = router_servers[server_id];
      var _res = rs.data.filter(r => eval(input.value));
      match_count.innerHTML = rs.loaded ? _res.length + ' Macthes' : 'Downloading Routing Informations...';
      if (rs.loaded) help.style.display = _res.length > 0 ? 'none' : '';
      return _res;
    } catch (e) {
      console.error('Filter Error: ' + e);
      input.className = 'error';
      match_count.className = 'error_t match_count';
      match_count.innerHTML = e;
    }
  };

  var tr = function(tds) {
    var resultTR = document.createElement('tr');
    tds.forEach(td => {
      var resultTD = document.createElement('td');
      resultTD.innerHTML = td.v;
      resultTD.className = td.c;
      resultTR.appendChild(resultTD);
    });
    return resultTR;
  };

  var update_view = function() {
    var resultHTML = document.createElement('div');
    resultHTML.className = 'disp';
    var results = get_routes(serv_id.value);
    var max = Number.parseInt(max_rslt.value);
    max = Number.isInteger(max) && max > 0 ? max : 10;
    results = results.slice(-1 * max);
    results.forEach(rou => {
      var table = document.createElement('table');
      var tbody = document.createElement('tbody');
      tbody.appendChild(new tr([{c: 't_route', v: rou.route}]));
      tbody.appendChild(new tr([{c: 't_dhead', v: 'Via'}, {c: 't_var', v: rou.via}]));
      tbody.appendChild(new tr([{c: 't_dhead', v: 'Device'}, {c: 't_var', v: rou.dev}]));
      tbody.appendChild(new tr([{c: 't_dhead', v: 'AS Path'}, {c: 't_var', v: rou.as_path.map(asn => `<a target="_blank" href="http://bgp.he.net/AS${asn}">AS${asn}</a>`).toString().replace(/,/g, ' ')}]));
      tbody.appendChild(new tr([{c: 't_dhead', v: 'Nexthop'}, {c: 't_var', v: rou.next_hop.toString().replace(/,/g, ' ')}]));
      if (rou.bgp_community) tbody.appendChild(new tr([{c: 't_dhead', v: 'Community'}, {c: 't_var', v: rou.bgp_community.toString().replace(/,/g, ' ')}]));
      table.appendChild(tbody);
      resultHTML.appendChild(table);
    });
    view.removeChild(document.getElementsByClassName("disp")[0]);
    view.appendChild(resultHTML);
  };

  return {
    update_view
  };
})();
