/*! jquery.views.js v0.9.90 (Beta): http://jsviews.com/ */
!function(e,t){var n=t.jQuery;"object"==typeof exports?module.exports=n?e(t,n):function(n){return e(t,n)}:"function"==typeof define&&define.amd?define(["jquery","./jsrender","./jquery.observable"],function(n,i,r){return e(t,n,i,r)}):e(t,!1)}(function(e,t,n,i){"use strict";function r(e,t,n,i){var r,a,l,o,s,d,p,c,f,v,g,u,_,h,m,x,b,k;if(n&&n._tgId&&(k=n,n=k._tgId),(d=at[n])&&(u=d.to)){for(u=u[t||0],r=d.linkCtx,f=r.elem,s=r.view,k=r.tag,!k&&u._cxp&&(k=u._cxp.path!==he&&u._cxp.tag,p=e[0],e=[],e[u._cxp.ind]=p),k&&(k._.chg=1,(l=k.convertBack)&&(a=pe(l)?l:s.getRsc("converters",l))),"SELECT"===f.nodeName&&(f.multiple&&null===e[0]&&(e=[[]]),f._jsvSel=e),c=e,a&&(e=a.apply(k,e),void 0===e&&(u=[]),e=G(e)?e:[e]),g=s.linkCtx,s.linkCtx=r,b=u.length;b--;)if((_=u[b])&&(_=_+""===_?[r.data,_]:_,o=_[0],h=_.tag,p=(_[1]===he?c:e)[b],!(void 0===p||k&&k.onBeforeUpdateVal&&k.onBeforeUpdateVal(i,{change:"change",data:o,path:_[1],index:b,tagElse:t,value:p})===!1)))if(h)h.updateValue(p,_.ind,_.tagElse,void 0,i),h.setValue&&h.setValue(p,_.ind,_.tagElse);else if(void 0!==p&&o){if((h=i&&(v=i.target)._jsvInd===b&&v._jsvLkEl)&&h.setValue(c[b],b,v._jsvElse),o._cpfn)for(x=r._ctxCb,m=o,o=r.data,m._cpCtx&&(o=m.data,x=m._cpCtx);m&&m.sb;)o=x(m,o),m=m.sb;X(o).setProperty(_[1],p)}s.linkCtx=g}if(k)return k._.chg=void 0,k}function a(e){var n,i,r=e.target,a=c(r),l=Qe[a];if(!r._jsvTr||e.delegateTarget!==ye&&"number"!==e.target.type||"input"===e.type){for(i=pe(a)?a(r):(r=t(r),l?r[l]():r.attr(a)),e.target._jsvChg=1,gt.lastIndex=0;n=gt.exec(e.target._jsvBnd);)D(i,r._jsvInd,r._jsvElse,n[1],e);e.target._jsvChg=void 0}}function l(e,t){var n,i,r,a,l,o,d,p=this,f=p.fn,v=p.tag,u=p.data,_=p.elem,h=p.convert,m=_.parentNode,x=p.view,b=x.linkCtx,k=t&&O(x,Le,v);if(x.linkCtx=p,m&&(!k||k.call(v||p,e,t)!==!1)&&(!t||"*"===e.data.prop||e.data.prop===t.path)){if(t&&(p.eventArgs=t),t||p._toLk){if(p._toLk=0,f._er)try{i=f(u,x,oe)}catch(C){l=f._er,o=ke(C,x,new Function("data,view","return "+l+";")(u,x)),i=[{props:{},args:[o],tag:v}]}else i=f(u,x,oe);if(n=v&&v.attr||p.attr||c(_,!0,void 0!==h),n===De&&(v&&v.parentElem||p.elem).type===Oe&&(n=qe),v){if(a=l||v._er,i=i[0]?i:[i],r=!a&&(v.onUpdate===!1||t&&pe(v.onUpdate)&&v.onUpdate(e,t,i)===!1),B(v,i,a),v._.chg&&(n===_e||n===De)||r||n===$e)return A(v,e,t),v._.chg||g(p,u,_),x.linkCtx=b,void(t&&(k=O(x,Pe,v))&&k.call(v||p,e,t));v.onUnbind&&v.onUnbind(v.tagCtx,p,v.ctx,e,t),i=":"===v.tagName?oe._cnvt(v.convert,x,i[0]):oe._tag(v,x,x.tmpl,i,!0,o)}else f._tag&&(h=""===h?Fe:h,i=h?oe._cnvt(h,x,i[0]||i):oe._tag(f._tag,x,x.tmpl,i,!0,o),F(v=p.tag),n=p.attr||n);(d=v&&!v.inline&&v.template)&&g(p,u,_),s(i,p,n,v),p._noUpd=0,v&&(v._er=l,A(v,e,t))}d||g(p,u,_),t&&(k=O(x,Pe,v))&&k.call(v||p,e,t),x.linkCtx=b}}function o(e,t){e._df=t,e[(t?"set":"remove")+"Attribute"](ze,"")}function s(n,i,r,a){var l,s,d,p,c,f,v,g,_,h,m,x,b,k,C=!(r===$e||void 0===n||i._noUpd||(r===De||r===_e)&&(a?a._.chg:i.elem._jsvChg)),y=i.data,E=a&&a.parentElem||i.elem,w=E.parentNode,j=t(E),A=i.view,V=i._val,I=A.linkCtx,T=a;return a&&(a._.unlinked=!0,a.parentElem=a.parentElem||i.expr||a._elCnt?E:w,s=a._prv,d=a._nxt),C?("visible"===r&&(r="css-display"),/^css-/.test(r)?("visible"===i.attr&&(b=(E.currentStyle||ut.call(e,E,"")).display,n?(n=E._jsvd||b,n!==$e||(n=rt[x=E.nodeName])||(m=ae.createElement(x),ae.body.appendChild(m),n=rt[x]=(m.currentStyle||ut.call(e,m,"")).display,ae.body.removeChild(m))):(E._jsvd=b,n=$e)),(T=T||V!==n)&&t.style(E,r.slice(4),n)):"link"!==r&&(/^data-/.test(r)?t.data(E,r.slice(5),n):/^prop-/.test(r)?(f=!0,r=r.slice(5)):r===qe?(f=!0,n=n&&"false"!==n):r===Re?(f=!0,r=qe,n=E.value===n):"selected"===r||"disabled"===r||"multiple"===r||"readonly"===r?n=n&&"false"!==n?r:null:r===De&&"SELECT"===E.nodeName&&(E._jsvSel=G(n)?n:""+n),(l=Qe[r])?r===_e?(A.linkCtx=i,a&&a.inline?(c=a.nodes(!0),a._elCnt&&(s&&s!==d?R(s,d,E,a._tgId,"^",!0):(v=E._df)&&(g=a._tgId+"^",_=v.indexOf("#"+g)+1,h=v.indexOf("/"+g),_&&h>0&&(_+=g.length,h>_&&(o(E,v.slice(0,_)+v.slice(h)),$(v.slice(_,h))))),s=s?s.previousSibling:d?d.previousSibling:E.lastChild),t(c).remove(),p=A.link(A.data,E,s,d,n,a&&{tag:a._tgId})):(C=C&&V!==n,C&&(j.empty(),p=A.link(y,E,s,d,n,a&&{tag:a._tgId}))),A.linkCtx=I):((T=T||V!==n)&&("text"===r&&E.children&&!E.children[0]?void 0!==E.textContent?E.textContent=n:E.innerText=null===n?"":n:j[l](n)),!(k=w._jsvSel)||r!==De&&j.attr(De)||(E.selected=t.inArray(""+n,G(k)?k:[k])>-1)):(T=T||V!==n)&&j[f?"prop":"attr"](r,void 0!==n||f?n:null)),i._val=n,u(p),T):void(i._val=n)}function d(e,t){var n=this,i=O(n,Le,n.tag),r=O(n,Pe,n.tag);if(!i||i.call(n,e,t)!==!1){if(t){var a=t.change,l=t.index,o=t.items;switch(n._.srt=t.refresh,a){case"insert":n.addViews(l,o);break;case"remove":n.removeViews(l,o.length);break;case"move":n.moveViews(t.oldIndex,l,o.length);break;case"refresh":n._.srt=void 0,n.fixIndex(0)}}r&&r.call(n,e,t)}}function p(e){var n,i,r=e.type,a=e.data,l=e._.bnd;!e._.useKey&&l&&((i=e._.bndArr)&&(t([i[1]]).off(ue,i[0]),e._.bndArr=void 0),l!==!!l?r?l._.arrVws[e._.id]=e:delete l._.arrVws[e._.id]:r&&a&&(n=function(t){t.data&&t.data.off||d.apply(e,arguments)},t([a]).on(ue,n),e._.bndArr=[n,a]))}function c(e,t,n){var i=e.nodeName.toLowerCase(),r=ve._fe[i]||e.contentEditable===Fe&&{to:_e,from:_e};return r?t?"input"===i&&e.type===Re?Re:r.to:r.from:t?n?"text":_e:""}function f(e,n,i,r,a,l,o){var s,d,p,c,f,v=e.parentElem,g=e._prv,_=e._nxt,h=e._elCnt;if(g&&g.parentNode!==v&&be("Missing parentNode"),o){c=e.nodes(),h&&g&&g!==_&&R(g,_,v,e._.id,"_",!0),e.removeViews(void 0,void 0,!0),d=_,h&&(g=g?g.previousSibling:_?_.previousSibling:v.lastChild),t(c).remove();for(f in e._.bnds)P(f)}else{if(n){if(p=r[n-1],!p)return!1;g=p._nxt}h?(d=g,g=d?d.previousSibling:v.lastChild):d=g.nextSibling}s=i.render(a,l,e._.useKey&&o,e,o||n,!0),u(e.link(a,v,g,d,s,p))}function v(e,t,n){var i,r;return n?(r="^`",F(n),i=n._tgId,i||(at[i=lt++]=n,n._tgId=""+i)):(r="_`",Ie[i=t._.id]=t),"#"+i+r+(void 0!=e?e:"")+"/"+i+r}function g(e,t,n){var i,r,a,l,o,s,d,p,c,f,v,g,u=e.tag,_=e.convertBack,h=e._hdl;if(t="object"==typeof t&&t,u&&((c=u.convert)&&(c=c===Fe?u.tagCtx.props.convert:c,c=e.view.getRsc("converters",c)||c,c=c&&c.depends,c=c&&oe._dp(c,t,h)),(f=u.depends)&&(f=oe._dp(f,u,h),c=c?c.concat(f):f),g=u.linkedElems),c=c||[],!e._depends||""+e._depends!=""+c){if(o=e.fn.deps.slice(),e._depends&&(v=e._depends.bdId,X._apply(1,[t],o,e._depends,h,e._ctxCb,!0)),u&&u.boundProps)for(r=u.boundProps.length;r--;)for(d=u.boundProps[r],a=u._.bnd.paths.length;a--;)p=u._.bnd.paths[a][d],p&&p.skp&&(o=o.concat(p));for(r=o.length;r--;)s=o[r],s._cpfn&&(o[r]=de({},s));if(i=X._apply(1,[t],o,c,h,e._ctxCb),v||(v=e._bndId||""+lt++,e._bndId=void 0,n._jsvBnd=(n._jsvBnd||"")+"&"+v,e.view._.bnds[v]=v),i.elem=n,i.linkCtx=e,i._tgId=v,c.bdId=v,e._depends=c,at[v]=i,(g||void 0!==_||u&&(u.bindTo||u.linkedElement||u.linkedCtxParam))&&S(i,u,_),g)for(r=g.length;r--;)for(l=g[r],a=l&&l.length;a--;)l[a]._jsvLkEl=u,T(u,l[a]),l[a]._jsvBnd="&"+v+"+";else void 0!==_&&T(u,n);u&&(u.flow||u.inline||(n.setAttribute(Ne,(n.getAttribute(Ne)||"")+"#"+v+"^/"+v+"^"),u._tgId=""+v))}}function u(e){var t;if(e)for(;t=e.pop();)t._hdl()}function _(e,t,n,i,r,a,l){return h(this,e,t,n,i,r,a,l)}function h(e,n,i,r,l,s,d,p){if(r===!0?(l=r,r=void 0):r="object"!=typeof r?void 0:de({},r),e&&n){n=n.jquery?n:t(n),ye||(ye=ae.body,Se="oninput"in ye,t(ye).on(Be,a).on("blur.jsv","[contenteditable]",a));for(var c,f,g,_,h,m,b,k,C,E,w=v,j=r&&"replace"===r.target,A=n.length;A--;){if(b=n[A],s=s||we(b),(C=s===re)&&(re.data=(re.ctx=r||{}).root=i),""+e===e)x(E=[],e,b,s,void 0,!0,i,r);else{if(void 0!==e.markup)j&&(m=b.parentNode),s._.scp=!0,g=e.render(i,r,l,s,void 0,w,!0),s._.scp=void 0,m?(d=b.previousSibling,p=b.nextSibling,t.cleanData([b],!0),m.removeChild(b),b=m):(d=p=void 0,t(b).empty());else{if(e!==!0||s!==re)break;k={lnk:1}}if(b._df&&!p){for(_=y(b._df,!0,dt),c=0,f=_.length;c<f;c++)h=_[c],(h=Ie[h.id])&&void 0!==h.data&&h.parent.removeViews(h._.key,void 0,!0);o(b)}E=s.link(i,b,d,p,g,k,r)}u(E)}}return n}function m(e,n,i,r,a,l,s,c){function f(e,t,n,i,r,l,o,s,d,p,c,f,v,g){var u,_,m="";return g?(h=0,e):(b=d||p||"",i=i||c,n=n||v,Z&&!n&&(!e||i||b||l&&!h)&&(Z=void 0,Y=ke.shift()),i=i||n,i&&(h=0,Z=void 0,z&&(n||v?it[Y]||/;svg;|;math;/.test(";"+ke.join(";")+";")||(u="'<"+Y+".../"):it[i]?u="'</"+i:ke.length&&i===Y||(u="Mismatch: '</"+i),u&&me(u+">' in:\n"+a)),re=ie,Y=ke.shift(),ie=tt[Y],c=c?"</"+c+">":"",re&&(_e+=oe,oe="",ie?_e+="-":(m=c+He+"@"+_e+Ke+(f||""),_e=Ce.shift()))),ie?(l?oe+=l:t=c||v||"",b&&(t+=b,oe&&(t+=" "+Ne+'="'+oe+'"',oe=""))):t=l?t+m+r+(h?"":He+l+Ke)+s+b:m||e,z&&o&&(h&&me("{^{ within elem markup ("+h+' ). Use data-link="..."'),"#"===l.charAt(0)?ke.unshift(l.slice(1)):l.slice(1)!==(_=ke.shift())&&me("Closing tag for {^{...}} under different elem: <"+_+">")),b&&(h=b,ke.unshift(Y),Y=b.slice(1),z&&ke[0]&&ke[0]===nt[Y]&&be("Parent of <tr> must be <tbody>"),Z=it[Y],(ie=tt[Y])&&!re&&(Ce.unshift(_e),_e=""),re=ie,_e&&ie&&(_e+="+")),t)}function g(e,t){var i,r,a,l,s,c,f,g=[];if(e){for("@"===e._tkns.charAt(0)&&(t=N.previousSibling,N.parentNode.removeChild(N),N=void 0),T=e.length;T--;){if(L=e[T],a=L.ch,i=L.path)for(I=i.length-1;r=i.charAt(I--);)"+"===r?"-"===i.charAt(I)?(I--,t=t.previousSibling):t=t.parentNode:t=t.lastChild;"^"===a?(b=at[s=L.id])&&(f=t&&(!N||N.parentNode!==t),N&&!f||(b.parentElem=t),L.elCnt&&f&&o(t,(L.open?"#":"/")+s+a+(t._df||"")),g.push([f?null:N,L])):(B=Ie[s=L.id])&&(B.parentElem||(B.parentElem=t||N&&N.parentNode||n,B._.onRender=v,B._.onArrayChange=d,p(B)),l=B.parentElem,L.open?(B._elCnt=L.elCnt,t&&!N?o(t,"#"+s+a+(t._df||"")):(B._prv||o(l,k(l._df,"#"+s+a)),B._prv=N)):(!t||N&&N.parentNode===t?N&&(B._nxt||o(l,k(l._df,"/"+s+a)),B._nxt=N):(o(t,"/"+s+a+(t._df||"")),B._nxt=void 0),(c=B.ctx&&B.ctx[Ue]||Ee)&&c.call(B.ctx.tag,B)))}for(T=g.length;T--;)he.push(g[T])}return!e||e.elCnt}function u(e){var t,n,i;if(e)for(T=e.length,I=0;I<T;I++)if(L=e[I],b=at[L.id],!b._is&&b.linkCtx&&(n=b=b.linkCtx.tag,i=b.tagName===K,!b.flow||i)){if(!F){for(t=1;n=n.parent;)t++;J=J||t}!F&&t!==J||K&&!i||M.push(b)}}function _(){var l,o,d="",p={},c=Ae+(fe?",["+ze+"]":"");for(S=et?n.querySelectorAll(c):t(c,n).get(),V=S.length,i&&i.innerHTML&&(U=et?i.querySelectorAll(c):t(c,i).get(),i=U.length?U[U.length-1]:i),J=0,j=0;j<V;j++)if(N=S[j],i&&!de)de=N===i;else{if(r&&N===r){fe&&(d+=C(N));break}if(N.parentNode)if(fe){if(d+=C(N),N._df){for(l=j+1;l<V&&N.contains(S[l]);)l++;p[l-1]=N._df}p[j]&&(d+=p[j]||"")}else ce&&(L=y(N,void 0,ct))&&(L=L[0])&&(pe=pe?L.id!==pe&&pe:L.open&&L.id),!pe&&Te(y(N))&&N.getAttribute(je)&&he.push([N])}if(fe&&(d+=n._df||"",(o=d.indexOf("#"+fe.id)+1)&&(d=d.slice(o+fe.id.length)),o=d.indexOf("/"+fe.id),o+1&&(d=d.slice(0,o)),u(y(d,void 0,ft))),void 0===a&&n.getAttribute(je)&&he.push([n]),E(i,ie),E(r,ie),!fe)for(ie&&_e+oe&&(N=r,_e&&(r?g(y(_e+"+",!0),r):g(y(_e,!0),n)),g(y(oe,!0),n),r&&(d=r.getAttribute(Ne),(V=d.indexOf(se)+1)&&(d=d.slice(V+se.length-1)),r.setAttribute(Ne,oe+d))),V=he.length,j=0;j<V;j++)N=he[j],P=N[1],N=N[0],P?(b=at[P.id])&&((m=b.linkCtx)&&(b=m.tag,b.linkCtx=m),P.open?(N&&(b.parentElem=N.parentNode,b._prv=N),b._elCnt=P.elCnt,B=b.tagCtx.view,x(ye,void 0,b._prv,B,P.id)):(b._nxt=N,b._.unlinked&&!b._toLk&&(H=b.tagCtx,B=H.view,A(b)))):x(ye,N.getAttribute(je),N,we(N),void 0,ce,e,s)}var h,m,b,j,V,I,T,S,N,B,L,P,U,q,R,$,D,M,F,K,H,z,J,Q,W,X,G,Y,Z,ee,te,ne,ie,re,le,oe,se,de,pe,ce,fe,ge=this,ue=ge._.id+"_",_e="",he=[],ke=[],Ce=[],ye=[],Ee=O(ge,Ue),Te=g;if(l&&(l.tmpl?R="/"+l._.id+"_":(ce=l.lnk,l.tag&&(ue=l.tag+"^",l=!0),(fe=l.get)&&(Te=u,M=fe.tags,F=fe.deep,K=fe.name)),l=l===!0),n=n?""+n===n?t(n)[0]:n.jquery?n[0]:n:ge.parentElem||ae.body,z=!ve.noValidate&&n.contentEditable!==Fe,Y=n.tagName.toLowerCase(),ie=!!tt[Y],i=i&&w(i,ie),r=r&&w(r,ie)||null,void 0!=a){if(te=ae.createElement("div"),ee=te,se=oe="",le="http://www.w3.org/2000/svg"===n.namespaceURI?"svg_ns":(G=xe.exec(a))&&G[1]||"",ie){for(D=r;D&&!($=y(D));)D=D.nextSibling;(ne=$?$._tkns:n._df)&&(q=R||"",!l&&R||(q+="#"+ue),I=ne.indexOf(q),I+1&&(I+=q.length,se=oe=ne.slice(0,I),ne=ne.slice(I),$?D.setAttribute(Ne,ne):o(n,ne)))}if(Z=void 0,a=(""+a).replace(st,f),z&&ke.length&&me("Mismatched '<"+Y+"...>' in:\n"+a),c)return;for(Ze.appendChild(te),le=Ve[le]||Ve.div,Q=le[0],ee.innerHTML=le[1]+a+le[2];Q--;)ee=ee.lastChild;for(Ze.removeChild(te),W=ae.createDocumentFragment();X=ee.firstChild;)W.appendChild(X);n.insertBefore(W,r)}return _(),ye}function x(e,t,n,i,r,a,l,o){var s,d,p,f,v,g,u,_,h,m,x,k=[];if(r)_=at[r],_=_.linkCtx?_.linkCtx.tag:_,u=_.linkCtx||{type:"inline",data:i.data,elem:_._elCnt?_.parentElem:n,view:i,ctx:i.ctx,attr:_e,fn:_._.bnd,tag:_,_bndId:r},_.linkCtx=u,b(u,e),_._toLk=u._bndId;else if(t&&n){for(l=a?l:i.data,s=i.tmpl,t=j(t,c(n)),x=Ee.lastIndex=0;d=Ee.exec(t);)k.push(d),x=Ee.lastIndex;for(x<t.length&&me(t);d=k.shift();){for(h=Ee.lastIndex,p=d[1],v=d[3];k[0]&&"else"===k[0][4];)v+=ne+Z+k.shift()[3],m=!0;m&&(v+=ne+Z+ee+"/"+d[4]+te),u={type:a?"top":"link",data:l,elem:n,view:i,ctx:o,attr:p,isLk:a,_toLk:1,_noUpd:d[2]},f=void 0,d[6]&&(f=d[10]||void 0,u.convert=d[5]||"",void 0!==f&&c(n)&&(p&&me(v+"- Remove target: "+p),u.convertBack=f=f.slice(1))),u.expr=p+v,g=s.links[v],g||(s.links[v]=g=oe.tmplFn(v,s,!0,f,m)),u.fn=g,b(u,e),Ee.lastIndex=h}}}function b(e,t){function n(t,n){l.call(e,t,n)}e.isLk&&(e.view=new oe.View(oe.extendCtx(e.ctx,e.view.ctx),"link",e.view,e.data,e.expr,(void 0),v)),e._ctxCb=oe._gccb(e.view),e._hdl=n,e.fn._lr?(e._toLk=1,t.push(e)):n(!0)}function k(e,t){var n;return e?(n=e.indexOf(t),n+1?e.slice(0,n)+e.slice(n+t.length):e):""}function C(e){return e&&(""+e===e?e:e.tagName===Me?e.type.slice(3):1===e.nodeType&&e.getAttribute(Ne)||"")}function y(e,t,n){function i(e,t,n,i,a,o){l.push({elCnt:r,id:i,ch:a,open:t,close:n,path:o,token:e})}var r,a,l=[];if(a=t?e:C(e))return r=l.elCnt=e.tagName!==Me,r="@"===a.charAt(0)||r,l._tkns=a,a.replace(n||vt,i),l}function E(e,t){e&&("jsv"===e.type?e.parentNode.removeChild(e):t&&""===e.getAttribute(je)&&e.removeAttribute(je))}function w(e,t){for(var n=e;t&&n&&1!==n.nodeType;)n=n.previousSibling;return n&&(1!==n.nodeType?(n=ae.createElement(Me),n.type="jsv",e.parentNode.insertBefore(n,e)):C(n)||n.getAttribute(je)||n.setAttribute(je,"")),n}function j(e,n){return e=t.trim(e).replace(Ce,"\\$&"),e.slice(-1)!==te?e=ee+":"+e+(n?":":"")+te:e}function A(e,n,i){function r(){a=_.linkedElems||e.linkedElems||e.linkedElem&&[e.linkedElem],a&&(e.linkedElems=_.linkedElems=a,e.linkedElem=a[0]=e.linkedElem||a[0]),(o=_.mainElem||e.mainElem)&&(_.mainElem=e.mainElem=o),(o=_.displayElem||e.displayElem)&&(_.displayElem=e.displayElem=o)}var a,l,o,s,d,p,c,f,v,g,u,_=e.tagCtx,h=e.tagCtxs,m=h&&h.length,x=e.linkCtx,b=e.bindTo||{};if(e._.unlinked){if(p=t(x.elem),e.linkedElement||e.mainElement||e.displayElement){if(l=e.linkedElement)for(e.linkedElem=void 0,s=l.length;s--;)if(l[s])for(d=m;d--;)c=!d&&!e.inline&&p.filter(l[s]),f=h[d],a=f.linkedElems=f.linkedElems||new Array(s),o=c[0]?c:f.contents(!0,l[s]),o[0]&&o[0].type!==Re&&(a[s]=o.eq(0));if(l=e.mainElement)for(d=m;d--;)c=!d&&!e.inline&&p.filter(l),f=h[d],o=c[0]?c:f.contents(!0,l).eq(0),o[0]&&(f.mainElem=o);if(l=e.displayElement)for(d=m;d--;)c=!d&&!e.inline&&p.filter(l),f=h[d],o=c[0]?c:f.contents(!0,l).eq(0),o[0]&&(f.displayElem=o,d||(e.displayElem=o));r()}e.onBind&&(e.onBind(_,x,e.ctx,n,i),r())}for(d=m;d--;)f=h[d],v=f.props,(o=f.mainElem||!e.mainElement&&f.linkedElems&&f.linkedElems[0])&&(o[0]&&v.id&&!o[0].id&&(o[0].id=v.id),e.setSize&&((g=!b.height&&v.height||e.height)&&o.height(g),(g=!b.width&&v.width||e.width)&&o.width(g))),(g=(o=f.displayElem||o)&&(!b["class"]&&v["class"]||e.className))&&(u=o[0]._jsvCl,g!==u&&(o.hasClass(u)&&o.removeClass(u),o.addClass(g),o[0]._jsvCl=g));e.onAfterLink&&(e.onAfterLink(_,x,e.ctx,n,i),r()),e.flow||e._.chg||(e.inline&&e._.unlinked&&(e.linkedElems||b)&&S(at[e._tgId],e),e.setValue()),e._.unlinked=void 0}function V(e){var t=e.which;t>15&&t<21||t>32&&t<41||t>111&&t<131||27===t||144===t||setTimeout(function(){a(e)})}function I(e,t,n){t===!0&&Se?e[n]("input.jsv",a):(t=""+t===t?t:"keydown.jsv",e[n](t,t.indexOf("keydown")>=0?V:a))}function T(e,n){var i,r,a=n._jsvTr||!1;e&&(r=e.tagCtx.props.trigger,void 0===r&&(r=e.trigger)),void 0===r&&(r=se.trigger),r=r&&("INPUT"===n.tagName&&n.type!==Oe&&n.type!==Re||"textarea"===n.type||n.contentEditable===Fe)&&r||!1,a!==r&&(i=t(n),I(i,a,"off"),I(i,n._jsvTr=r,"on"))}function S(e,t,n){var i,r,a,l,o,s,d,p,c,f,v,g,u,_=1,h=[],m=e.linkCtx,x=m.data,b=m.fn.paths;if(e&&!e.to){for(t&&(t.convertBack=t.convertBack||n,s=t.bindTo,_=t.tagCtxs?t.tagCtxs.length:1);_--;){if(u=[],g=b[_])for(s=g._jsvto?["_jsvto"]:s||[0],p=s.length;p--;){if(r="",v=m._ctxCb,d=g[s[p]],i=d&&d.length){if(a=d[i-1],a._cpfn){for(l=a;a.sb&&a.sb._cpfn;)r=a=a.sb;r=a.sb||r&&r.path,a=r?r.slice(1):l.path}o=r?[l,a]:N(a,x,v)}else f=t.linkedCtxParam,o=[],f&&f[p]&&(o=[t.tagCtxs[_].ctx[f[p]][0],he]);(c=o._cxp)&&c.tag&&a.indexOf(".")<0&&(o=c),u.unshift(o)}h.unshift(u)}e.to=h}}function N(e,t,n){for(var i,r,a,l,o,s,d,p;e&&e!==he&&(a=n(i=e.split("^").join("."),t))&&(l=a.length);){if(o=a[0]._cxp)if(d=d||o,s=a[0][0],he in s?(p=s,s=s._vw):p=s.data,d.path=e=a[0][1],a=[d.data=p,e],n=oe._gccb(s),e._cpfn){for(r=e,r.data=a[0],r._cpCtx=n;e.sb&&e.sb._cpfn;)i=e=e.sb;i=e.sb||i&&i.path,e=i?i.slice(1):r.path,a=[r,e]}else o.tag&&o.path===he&&(a=o);else a=l>2?[a[l-3],a[l-2]]:[a[l-2]];t=a[0],e=a[1]}return a=a||[t,i],a._cxp=d,a}function B(e,t,n){var i,r,a=e.tagCtx.view,l=e.tagCtxs||[e.tagCtx],o=l.length,s=!t;if(t=t||e._.bnd.call(a.tmpl,(e.linkCtx||a).data,a,oe),n)l=e.tagCtxs=t,e.tagCtx=l[0],F(e);else for(;o--;)i=l[o],r=t[o],X(i.props).setProperty(r.props),de(i.ctx,r.ctx),i.args=r.args,s&&(i.tmpl=r.tmpl);return oe._ths(e,l[0]),l}function L(e){for(var t,n,i,r=[],a=e.length,l=a;l--;)r.push(e[l]);for(l=a;l--;)if(n=r[l],n.parentNode){if(i=n._jsvBnd)for(i=i.slice(1).split("&"),n._jsvBnd="",t=i.length;t--;)P(i[t],n._jsvLkEl,n);$(C(n)+(n._df||""),n)}}function P(e,n,i){var r,a,l,o,s,d,p,c,f,v,g,u,_,h,m=at[e];if(n)i._jsvLkEl=void 0;else if(m&&(!i||i===m.elem)){delete at[e];for(r in m.bnd)o=m.bnd[r],s=m.cbId,G(o)?t([o]).off(ue+s).off(ge+s):t(o).off(ge+s),delete m.bnd[r];if(a=m.linkCtx){if(l=a.tag){if(d=l.tagCtxs)for(p=d.length;p--;)u=d[p],(c=u.map)&&c.unmap(),(_=u.linkedElems)&&(h=(h||[]).concat(_));l.onUnbind&&l.onUnbind(l.tagCtx,a,l.ctx,!0),l.onDispose&&l.onDispose(),l._elCnt||(l._prv&&l._prv.parentNode.removeChild(l._prv),l._nxt&&l._nxt.parentNode.removeChild(l._nxt))}for(_=h||[t(a.elem)],p=_.length;p--;)f=_[p],(v=f&&f[0]&&f[0]._jsvTr)&&(I(f,v,"off"),f[0]._jsvTr=void 0);g=a.view,"link"===g.type?g.parent.removeViews(g._.key,void 0,!0):delete g._.bnds[e]}delete m.s[m.cbId]}}function U(e){e?(e=e.jquery?e:t(e),e.each(function(){for(var e;(e=we(this,!0))&&e.parent;)e.parent.removeViews(e._.key,void 0,!0);L(this.getElementsByTagName("*"))}),L(e)):(ye&&(t(ye).off(Be,a).off("blur.jsv","[contenteditable]",a),ye=void 0),re.removeViews(),L(ae.body.getElementsByTagName("*")))}function q(e){return e.type===Oe?e[qe]:e.value}function O(e,t,n){return n&&n[t]||e.ctx[t]&&e.ctxPrm(t)||Y.helpers[t]}function R(e,t,n,i,r,a){var l,s,d,p,c,f,v,g=0,u=e===t;if(e){for(d=y(e)||[],l=0,s=d.length;l<s;l++){if(p=d[l],f=p.id,f===i&&p.ch===r){if(!a)break;s=0}u||(c="_"===p.ch?Ie[f]:at[f].linkCtx.tag,p.open?c._prv=t:p.close&&(c._nxt=t)),g+=f.length+2}g&&e.setAttribute(Ne,e.getAttribute(Ne).slice(g)),v=t?t.getAttribute(Ne):n._df,(s=v.indexOf("/"+i+r)+1)&&(v=d._tkns.slice(0,g)+v.slice(s+(a?-1:i.length+1))),v&&(t?t.setAttribute(Ne,v):o(n,v))}else o(n,k(n._df,"#"+i+r)),a||t||o(n,k(n._df,"/"+i+r))}function $(e,t){var n,i,r,a;if(a=y(e,!0,pt))for(n=0,i=a.length;n<i;n++)r=a[n],"_"===r.ch?!(r=Ie[r.id])||!r.type||t&&r._prv!==t&&r.parentElem!==t||r.parent.removeViews(r._.key,void 0,!0):P(r.id,void 0,t)}function D(e,t,n,i,a){var l=[];return this&&this._tgId&&(i=this),l[t||0]=e,r(l,n,i,a),this}function M(){var e=arguments,t=e.length;for(t||(e=this.tag.cvtArgs(!0,this.index),t=e.length);t--;)this.tag.setValue(e[t],t,this.index)}function F(e){var n,i,a,l,d,v,g,u;if(e.contents=function(e,n){e!==!!e&&(n=e,e=void 0);var i,r=t(this.nodes());return r[0]&&(i=n?r.filter(n):r,r=e&&n?i.add(r.find(n)):i),r},e.nodes=function(e,t,n){var i,r=this.contentView||this,a=r._elCnt,l=!t&&a,o=[];if(!r.args)for(t=t||r._prv,n=n||r._nxt,i=l?t===r._nxt?r.parentElem.lastSibling:t:r.inline===!1?t||r.linkCtx.elem.firstChild:t&&t.nextSibling;i&&(!n||i!==n);)(e||a||i.tagName!==Me)&&o.push(i),i=i.nextSibling;return o},e.childTags=function(e,t){e!==!!e&&(t=e,e=void 0);var n=this.contentView||this,i=n.link?n:n.tagCtx.view,r=n._prv,a=n._elCnt,l=[];return n.args||i.link(void 0,n.parentElem,a?r&&r.previousSibling:r,n._nxt,void 0,{get:{tags:l,deep:e,name:t,id:n.link?n._.id+"_":n._tgId+"^"}}),l},"tag"===e._is){for(g=e,i=g.tagCtxs.length;i--;)a=g.tagCtxs[i],a.setValues=M,a.cvtArgs=oe._tg.prototype.cvtArgs,a.bndArgs=oe._tg.prototype.bndArgs,a.contents=e.contents,a.childTags=e.childTags,a.nodes=e.nodes;if(l=g.boundProps=g.boundProps||[],d=g.linkTo?["linkTo"]:g.bindTo)for(n=d.length;n--;)v=d[n],v+""===v&&(d[v]=1,t.inArray(v,l)<0&&l.push(v));g.setValue=oe._gm(g.constructor.prototype.setValue,function(e,i,r){if(!arguments.length)return g.setValues(),g;var a,l,o,s=g.linkedCtxParam,d=g.tagCtxs[r||0],p=d.props,c=g.linkCtx,f=d.linkedElems||g.linkedElem&&[g.linkedElem];if(void 0!==e?g.base.call(g,e,i,r):g.getValue&&(e=g.getValue(r))&&void 0!==e&&(g.bindTo.length>1&&(e=e[i]),s&&s[i]&&t.observable(d.ctx[s[i]][0]).setProperty(he,e)),(a=f&&f[i])&&a[0])for(n=a.length;n--;)l=a[n],g._.unlinked&&(o=l._jsvLkEl,o&&o===g||(o&&(e=o.cvtArgs(!0,r)[i]),l._jsvLkEl=g,l._jsvInd=i,l._jsvElse=r,T(g,l),l._jsvBnd="&"+g._tgId+"+")),void 0===e||l._jsvChg||c._val===e||(void 0!==l.value?l.type===Oe?l[qe]=e&&"false"!==e:l.type===Re?l[qe]=l.value===e:G(e)?l.value=e:t(l).val(e):l.contentEditable===Fe&&(l.innerHTML=e)),p.name&&(l.name=l.name||p.name);return g}),g.updateValue=D,g.updateValues=function(){return r(arguments,void 0,this)},g.setValues=function(){for(var e=arguments.length?1:g.tagCtxs.length;e--;)M.apply(g.tagCtxs[e],arguments)},g.refresh=function(e){var t,n=g.linkCtx,i=g.tagCtx.view;return g.onUnbind&&g.onUnbind(g.tagCtx,n,g.ctx),t=g.inline?_e:n.attr||c(g.parentElem,!0),e=oe._tag(g,i,i.tmpl,B(g),!0),s(e,n,t,g),A(g),g},g.domChange=function(){var e=this.parentElem,n=t.hasData(e)&&t._data(e).events,i="jsv-domchange";n&&n[i]&&t(e).triggerHandler(i,arguments)}}else u=e,u.addViews=function(e,t){var n,i=this,r=t.length,a=i.views;!i._.useKey&&r&&(n=a.length+r,n===i.data.length&&f(i,e,i.tmpl,a,t,i.ctx)!==!1&&(i._.srt||i.fixIndex(e+r)))},u.removeViews=function(e,n,i,r){function a(e){var n,r,a,l,o,s,d=f[e];if(d&&d.link){if(n=d._.id,i||(s=d.nodes()),d.removeViews(void 0,void 0,!0),d.type=void 0,l=d._prv,o=d._nxt,a=d.parentElem,i||(d._elCnt&&R(l,o,a,n,"_"),t(s).remove()),!d._elCnt)try{l.parentNode.removeChild(l),o.parentNode.removeChild(o)}catch(c){}p(d);for(r in d._.bnds)P(r);delete Ie[n]}}var l,o,s,d=this,c=!d._.useKey,f=d.views;if(c&&(s=f.length),void 0===e)if(c){for(l=s;l--;)a(l);d.views=[]}else{for(o in f)a(o);d.views={}}else if(void 0===n&&(c?n=1:(a(e),delete f[e])),c&&n&&(r||s-n===d.data.length)){for(l=e+n;l-- >e;)a(l);f.splice(e,n),d._.srt||d.fixIndex(e)}},u.moveViews=function(e,n,i){function r(e,t){return RegExp("^(.*)("+(t?"\\/":"#")+e._.id+"_.*)$").exec(t||e._prv.getAttribute(Ne))}function a(e,t){e._prv.setAttribute(Ne,t)}var l,s,d,p=this,c=p._nxt,f=p.views,v=n<e,g=v?n:e,u=v?e:n,_=n,h=[],m=f.splice(e,i);for(n>f.length&&(n=f.length),f.splice.apply(f,[n,0].concat(m)),i=m.length,d=n+i,u+=i,_;_<d;_++)s=f[_],l=s.nodes(!0),h=p._elCnt?h.concat(l):h.concat(s._prv,l,s._nxt);if(h=t(h),d<f.length?h.insertBefore(f[d]._prv):c?h.insertBefore(c):h.appendTo(p.parentElem),p._elCnt){var x,b=v?g+i:u-i,k=f[g-1],C=f[g],y=f[b],E=f[u],w=r(C),j=r(y);a(C,j[1]+w[2]),E?(x=r(E),a(E,w[1]+x[2])):c?(x=r(p,c.getAttribute(Ne)),c.setAttribute(Ne,w[1]+x[2])):(x=r(p,p.parentElem._df),o(p.parentElem,w[1]+x[2])),a(y,x[1]+j[2]),k?k._nxt=C._prv:p._prv=C._prv,f[b-1]._nxt=y._prv,f[u-1]._nxt=E?E._prv:c}p.fixIndex(g)},u.refresh=function(){var e=this,t=e.parent;t&&(f(e,e.index,e.tmpl,t.views,e.data,void 0,!0),p(e))},u.fixIndex=function(e){for(var t=this.views,n=t.length;e<n--;)t[n].index!==n&&X(t[n]).setProperty("index",n)},u.link=m}function K(e,t,n){if("set"===n.change){for(var i=e.tgt,r=i.length;r--&&i[r].key!==n.path;);r===-1?n.path&&!n.remove&&X(i).insert({key:n.path,prop:n.value}):n.remove?X(i).remove(r):X(i[r]).setProperty("prop",n.value)}}function H(e,t,n){var i,r=e.src,a=n.change;"set"===a?"prop"===n.path?X(r).setProperty(t.target.key,n.value):(X(r).removeProperty(n.oldValue),X(r).setProperty(n.value,t.target.prop)):"remove"===a?(i=n.items[0],X(r).removeProperty(i.key),delete r[i.key]):"insert"===a&&(i=n.items[0],i.key&&X(r).setProperty(i.key,i.prop))}function z(e){return e.indexOf(".")<0}var J=t===!1;n=n||J&&e.jsrender,t=t||e.jQuery;var Q="JsViews requires ";if(!t||!t.fn)throw Q+"jQuery";n&&!n.fn&&n.views.sub._jq(t);var W,X,G=t.isArray,Y=t.views;if(!Y||!Y.map)throw Q+"JsRender";var Z,ee,te,ne,ie,re,ae=e.document,le=Y.settings,oe=Y.sub,se=oe.settings,de=oe.extend,pe=t.isFunction,ce=(t.expando,Y.converters),fe=Y.tags,ve=se.advanced,ge=oe.propChng=oe.propChng||"propertyChange",ue=oe.arrChng=oe.arrChng||"arrayChange",_e="html",he="_ocp",me=oe.syntaxErr,xe=/<(?!script)(\w+)[>\s]/,be=oe._er,ke=oe._err,Ce=/['"\\]/g;if(t.link)return t;se.trigger=!0;var ye,Ee,we,je,Ae,Ve,Ie,Te,Se,Ne="data-jsv",Be="change.jsv",Le="onBeforeChange",Pe="onAfterChange",Ue="onAfterCreate",qe="checked",Oe="checkbox",Re="radio",$e="none",De="value",Me="SCRIPT",Fe="true",Ke='"></script>',He='<script type="jsv',ze=Ne+"-df",Je="script,["+Ne+"]",Qe={value:"val",input:"val",html:_e,text:"text"},We={from:De,to:De},Xe=0,Ge=t.cleanData,Ye=le.delimiters,Ze=ae.createDocumentFragment(),et=ae.querySelector,tt={ol:1,ul:1,table:1,tbody:1,thead:1,tfoot:1,tr:1,colgroup:1,dl:1,select:1,optgroup:1,svg:1,svg_ns:1},nt={tr:"table"},it={br:1,img:1,input:1,hr:1,area:1,base:1,col:1,link:1,meta:1,command:1,embed:1,keygen:1,param:1,source:1,track:1,wbr:1},rt={},at={},lt=1,ot=/^#(view\.?)?/,st=/((\/>)|<\/(\w+)>|)(\s*)([#\/]\d+(?:_|(\^)))`(\s*)(<\w+(?=[\s\/>]))?|\s*(?:(<\w+(?=[\s\/>]))|<\/(\w+)>(\s*)|(\/>)\s*|(>)|$)/g,dt=/(#)()(\d+)(_)/g,pt=/(#)()(\d+)([_^])/g,ct=/(?:(#)|(\/))(\d+)(_)/g,ft=/(#)()(\d+)(\^)/g,vt=/(?:(#)|(\/))(\d+)([_^])([-+@\d]+)?/g,gt=/&(\d+)\+?/g,ut=e.getComputedStyle;if(X=t.observable,!X)throw Q+"JsObservable";return W=X.observe,F(oe.View.prototype),oe.onStore.template=function(e,n,i){null===n?(delete t.link[e],delete t.render[e]):(n.link=_,e&&!i&&"jsvTmpl"!==e&&(t.render[e]=n,t.link[e]=function(){return _.apply(n,arguments)}))},oe.viewInfos=y,(le.delimiters=function(){var e=Ye.apply(0,arguments),t=se.delimiters;return Z=t[0].charAt(0),ee=t[0].charAt(1),te=t[1].charAt(0),ne=t[1].charAt(1),ie=t[2],Ee=new RegExp("(?:^|\\s*)([\\w-]*)(\\"+ie+")?(\\"+ee+oe.rTag+"(:\\w*)?\\"+te+")","g"),e})(),oe.addSetting("trigger"),ce.merge=function(e){var t,n=this.linkCtx.elem.className,i=this.tagCtx.props.toggle;return i&&(t=i.replace(/[\\^$.|?*+()[{]/g,"\\$&"),t="(\\s(?="+t+"$)|(\\s)|^)("+t+"(\\s|$))",n=n.replace(new RegExp(t),"$2"),e=n+(e?(n&&" ")+i:"")),e},fe({on:{attr:$e,init:function(e){for(var n,i=this,r=0,a=e.args,l=a.length;r<l&&!pe(a[r]);r++);i._hi=l>r&&r+1,i.inline&&(oe.rTmpl.exec(n=t.trim(e.tmpl.markup))||(i.template="<button>"+(n||e.params.args[r]||"noop")+"</button>"),i.attr=_e)},onBind:function(){this.template&&(this.mainElem=this.contents("button"))},onAfterLink:function(e,n){var i,r,a,l=this,o=l._hi,s=e.args,d=s.length,p=e.props,c=p.data,f=e.view,v=p.context;o&&(i=s[o-1],r=s.slice(o),s=s.slice(0,o-1),l._sel=s[1],a=l.activeElem=l.activeElem||t(l.inline?(l._sel=s[1]||"*",l.parentElem):n.elem),v||(v=/^(.*)[\.^][\w$]+$/.exec(e.params.args.slice(-r.length-1)[0]),v=v&&oe.tmplFn(ee+":"+v[1]+te,f.tmpl,!0)(n.data,f)),l._evs&&l.onUnbind(),a.on(l._evs=s[0]||"click",l._sel,void 0==c?null:c,l._hlr=function(e){var t,a=!l.inline;if(!a)for(t=l.contents("*"),d=t.length;!a&&d--;)t[d].contains(e.target)&&(a=!0);if(a)return i.apply(v||n.data,[].concat(r,e,{change:e.type,view:f,linkCtx:n},r.slice.call(arguments,1)))}))},onUpdate:!1,onUnbind:function(){var e=this;e.activeElem&&e.activeElem.off(e._evs,e._sel,e._hlr)},contentCtx:!0,setSize:!0,dataBoundOnly:!0},radiogroup:{init:function(e){this.name=e.props.name||(Math.random()+"jsv").slice(9)},onBind:function(e,n){var i,r,a,l=this;for(l.inline?(i=l.contents("*")[0],i=i&&we(i).ctx.tag===l.parent?i:l.parentElem,r=l.contents(!0,"input[type=radio]")):(i=n.elem,r=t("input[type=radio]",n.elem)),l.linkedElem=r,a=r.length;a--;)r[a].name=r[a].name||l.name;t(i).on("jsv-domchange",function(t,n){var o,s,d=n.ctx.parentTags;if(!l.inline||i!==l.parentElem||d&&d[l.tagName]===l){for(s=l.cvtArgs()[0],r=l.linkedElem=l.contents(!0,"input[type=radio]"),a=r.length;a--;)o=r[a],o._jsvLkEl=l,o.name=o.name||l.name,o._jsvBnd="&"+l._tgId+"+",o.checked=s===o.value;l.linkedElems=e.linkedElems=[r]}})},onUpdate:!1,contentCtx:!0,dataBoundOnly:!0}}),de(fe["for"],{onArrayChange:function(e,t,n,i){var r,a=e.target,l=a.length,o=this,s=t.change;if(o._.noVws||o.tagCtxs[1]&&("insert"===s&&l===t.items.length||"remove"===s&&!l))o.refresh();else for(r in o._.arrVws)r=o._.arrVws[r],r.data===a&&d.apply(r,arguments);o.domChange(n,i,t),e.done=!0},onAfterLink:function(e,t){for(var n,i,r,a=this,l=0,o=a._ars||{},s=a.tagCtxs,d=s.length,p=a.selected||0;l<=p;l++)e=s[l],r=e.map?e.map.tgt:e.args.length?e.args[0]:e.view.data,(i=o[l])&&r!==i[0]&&(W(i[0],i[1],!0),delete o[l]),!o[l]&&G(r)&&!function(){var i=e;W(r,n=function(e,n){a.onArrayChange(e,n,i,t)}),o[l]=[r,n]}();for(l=p+1;l<d;l++)(i=o[l])&&(W(i[0],i[1],!0),delete o[l]);a._ars=o},onDispose:function(){var e,t=this;for(e in t._ars)W(t._ars[e][0],t._ars[e][1],!0)}}),de(fe["if"],{onUpdate:function(e,t,n){for(var i,r,a=0;i=this.tagCtxs[a];a++)if(r=i.props.tmpl!==n[a].props.tmpl||i.args.length&&!(i=i.args[0])!=!n[a].args[0],!this.convert&&i||r)return r;return!1},onAfterLink:function(e,t,n,i,r){r&&this.domChange(e,t,r)}}),fe("props",{baseTag:"for",dataMap:Y.map({getTgt:fe.props.dataMap.getTgt,obsSrc:K,obsTgt:H,tgtFlt:z}),flow:!0}),de(t,{view:we=function(e,n,i){function r(e,t){if(e)for(l=y(e,t,dt),s=0,d=l.length;s<d&&(!(a=Ie[l[s].id])||!(a=a&&i?a.get(!0,i):a));s++);}n!==!!n&&(i=n,n=void 0);var a,l,o,s,d,p,c,f=0,v=ae.body;if(e&&e!==v&&re._.useKey>1&&(e=""+e===e?t(e)[0]:e.jquery?e[0]:e)){if(n){if(r(e._df,!0),!a)for(c=et?e.querySelectorAll(Je):t(Je,e).get(),p=c.length,o=0;!a&&o<p;o++)r(c[o]);return a}for(;e;){if(l=y(e,void 0,ct))for(p=l.length;p--;)if(a=l[p],a.open){if(f<1)return a=Ie[a.id],a&&i?a.get(i):a||re;f--}else f++;e=e.previousSibling||e.parentNode}}return re},link:h,unlink:U,cleanData:function(e){e.length&&Xe&&L(e),Ge.apply(t,arguments)}}),de(t.fn,{link:function(e,t,n,i,r,a,l){return h(e,this,t,n,i,r,a,l)},unlink:function(){return U(this)},view:function(e,t){return we(this[0],e,t)}}),t.each([_e,"replaceWith","empty","remove"],function(e,n){var i=t.fn[n];t.fn[n]=function(){var e;Xe=1;try{e=i.apply(this,arguments)}finally{Xe=0}return e}}),de(re=oe.topView,{tmpl:{links:{}}}),Ie={0:re},oe._glt=function(e){for(var t,n=/#(\d*)\^\/\1\^/g,i=[],r=C(e);t=n.exec(r);)(t=at[t[1]])&&i.push(t.linkCtx.tag);return i},oe._gccb=function(e){return function(t,n,i){var r,a,l,o,s,d,p,c,f,v,g;if(e&&t){if(t._cpfn)return t._cpfn.call(e.tmpl,n,e,oe);if("~"===t.charAt(0)){if("~tag"===t.slice(0,4)&&(a=e.ctx,"."===t.charAt(4)&&(r=t.slice(5).split("."),a=a.tag),r))return a?[a,r.join("."),n]:[];if(t=t.slice(1).split("."),o=e.ctxPrm(s=t.shift(),void 0,!0))if(c=o._cxp){if(t.length&&(d="."+t.join("."),s=o[p=o.length-1],s._cpfn?(s.sb=d,s.bnd=!!i):(o[p]=(s+d).replace("#data.",""),"#view"===s.slice(0,5)&&(o[p]=o[p].slice(6),o.splice(p,0,e)))),l=[o],(a=c.tag)&&a.convert)for(g=a.bindTo||[0],p=g.length;p--;)void 0!==i&&p!==c.ind&&(v=g[p],f=[o[0],a.tagCtx.params[+v===v?"args":"props"]],f._cxp=c,l.push(f))}else(t.length||pe(o))&&(l=[o,t.join("."),n]);return l||[]}if("#"===t.charAt(0))return"#data"===t?[]:[e,t.replace(ot,""),n]}}},oe._cp=function(e,t,n,i){if(n.linked){if(t){var r=ee+":"+t+te,a=re.tmpl.links,l=a[r];l||(a[r]=l=oe.tmplFn(r,n.tmpl,!0)),e=l.deps[0]?[n,l]:[{
_ocp:i?i.tag.cvtArgs(!0,i.tagElse)[i.ind]:l()}]}else e=[{_ocp:void 0}];e._cxp=i||{updateValue:function(t){return X(e._cxp.data).setProperty(e._cxp.path,t),this}}}return e},oe._crcp=function(e,n,i,r){return(r||(i._ocps=i._ocps||{}))[e]=n=[{_ocp:n,_vw:i}],n._cxp={path:he,ind:0,updateValue:function(e,i){return t.observable(n[0]).setProperty(he,e),this}},n},oe._ucp=function(e,n,i,r){var a,l;return r.path||N("~"+e,i.data,oe._gccb(i)),(l=r.tag)&&(a=t.inArray(e,l.linkedCtxParam),l.setValue(n,a,r.tagElse)),(l||r).updateValue(n,a,r.tagElse)},oe._ceo=function _t(e){for(var t,n=[],i=e.length;i--;)t=e[i],t._cpfn&&(t=de({},t),t.prm=_t(t.prm)),n.unshift(t);return n},Te=oe.advSet,oe.advSet=function(){Te.call(oe),e._jsv=ve._jsv?de(e._jsv||{},{views:Ie,bindings:at}):void 0,je=ve.linkAttr,Ae=Je+",["+je+"]",Ve=ve._wm,Ve.optgroup=Ve.option,Ve.tbody=Ve.tfoot=Ve.colgroup=Ve.caption=Ve.thead,Ve.th=Ve.td},le.advanced({linkAttr:"data-link",useViews:!1,noValidate:!1,_wm:{option:[1,"<select multiple='multiple'>","</select>"],legend:[1,"<fieldset>","</fieldset>"],area:[1,"<map>","</map>"],param:[1,"<object>","</object>"],thead:[1,"<table>","</table>"],tr:[2,"<table><tbody>","</tbody></table>"],td:[3,"<table><tbody><tr>","</tr></tbody></table>"],col:[2,"<table><tbody></tbody><colgroup>","</colgroup></table>"],svg_ns:[1,"<svg>","</svg>"],div:t.support.htmlSerialize?[0,"",""]:[1,"X<div>","</div>"]},_fe:{input:{from:q,to:De},textarea:We,select:We,optgroup:{to:"label"}}}),t},window);
//# sourceMappingURL=jquery.views.min.js.map
