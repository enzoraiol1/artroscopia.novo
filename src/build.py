t=open('template.html').read()
t=t.replace('/*CORE*/',open('core.js').read()).replace('/*APP*/',open('app.js').read())
open('index.html','w').write(t)
print(len(t))
