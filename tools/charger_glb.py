import json,struct,numpy as np
CT={5126:np.float32,5125:np.uint32,5123:np.uint16,5121:np.uint8}
NC={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4}
def charger(p):
    b=open(p,'rb').read()
    l,_=struct.unpack('<I4s',b[12:20]); j=json.loads(b[20:20+l])
    off=20+l; bl,_=struct.unpack('<I4s',b[off:off+8]); bin_=b[off+8:off+8+bl]
    def acc(i):
        a=j['accessors'][i]; bv=j['bufferViews'][a['bufferView']]
        o=bv.get('byteOffset',0)+a.get('byteOffset',0); n=a['count']*NC[a['type']]
        arr=np.frombuffer(bin_,dtype=CT[a['componentType']],count=n,offset=o)
        return arr.reshape(a['count'],NC[a['type']]) if NC[a['type']]>1 else arr
    pr=j['meshes'][0]['primitives'][0]
    return j,bin_,acc(pr['attributes']['POSITION']),acc(pr['attributes']['TEXCOORD_0']),acc(pr['attributes']['NORMAL']),acc(pr['indices']).reshape(-1,3)
