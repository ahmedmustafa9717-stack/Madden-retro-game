import bpy, math, bmesh
# Rebuild only this dedicated original-athlete asset studio.
bpy.ops.object.select_all(action="SELECT");bpy.ops.object.delete(use_global=False)
from mathutils import Vector
# Original authored athlete. Coordinates below use the game's Y-up, -Z-forward convention.
# Convert once to Blender Z-up; glTF export converts it back to Y-up.
S=1.90/2.045
B=lambda p: Vector((p[0]*S,-p[2]*S,p[1]*S))
verts=[];faces=[];face_mats=[];weights=[]
materials=[]
def material(name,color,rough,metal=0):
 m=bpy.data.materials.new(name);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Roughness'].default_value=rough;p.inputs['Metallic'].default_value=metal
 if name=='Helmet':p.inputs['Coat Weight'].default_value=.9;p.inputs['Coat Roughness'].default_value=.18
 materials.append(m);return len(materials)-1
jersey=material('Jersey',(.045,.20,.23),.92);pants=material('Pants',(.025,.055,.09),.88);skin=material('Skin',(.32,.16,.085),.85);helmet=material('Helmet',(.025,.075,.11),.25,.12);mask=material('Facemask',(.45,.52,.58),.28,.8);glove=material('Gloves',(.75,.80,.79),.8);shoe=material('Cleats',(.018,.025,.03),.5);trim=material('Accent',(.30,.76,.67),.55)
def meshpart(v,f,mat,w):
 base=len(verts);verts.extend([B(p) for p in v]);weights.extend(w if isinstance(w,list) else [w]*len(v));faces.extend([tuple(base+i for i in face) for face in f]);face_mats.extend([mat]*len(f))
def loft(rings,mat,bone,n=32):
 v=[];f=[];w=[]
 for j,(cx,y,cz,rx,rz) in enumerate(rings):
  for i in range(n):
   a=i/n*math.tau;v.append((cx+rx*math.cos(a),y,cz+rz*math.sin(a)));w.append(bone(y) if callable(bone) else {bone:1})
 for j in range(len(rings)-1):
  for i in range(n):a=j*n+i;b=j*n+(i+1)%n;f.append((a,b,b+n,a+n))
 f.extend([tuple(reversed(range(n))),tuple((len(rings)-1)*n+i for i in range(n))]);meshpart(v,f,mat,w)
def ellipsoid(center,radii,mat,bone,segments=32,rings=16):
 v=[];f=[]
 for j in range(rings+1):
  theta=.002+(math.pi-.004)*j/rings
  for i in range(segments):
   phi=i/segments*math.tau;v.append(tuple(center[k]+radii[k]*[math.sin(theta)*math.cos(phi),math.cos(theta),math.sin(theta)*math.sin(phi)][k] for k in range(3)))
 for j in range(rings):
  for i in range(segments):a=j*segments+i;b=j*segments+(i+1)%segments;f.append((a,b,b+segments,a+segments))
 meshpart(v,f,mat,{bone:1})
def tube(points,radius,mat,bone,sides=8):
 v=[];f=[]
 for j,p in enumerate(points):
  tangent=Vector(points[min(j+1,len(points)-1)])-Vector(points[max(0,j-1)]);tangent.normalize();axis=Vector((0,1,0)) if abs(tangent.y)<.9 else Vector((1,0,0));right=tangent.cross(axis).normalized();up=tangent.cross(right).normalized()
  for i in range(sides):q=Vector(p)+radius*(right*math.cos(i/sides*math.tau)+up*math.sin(i/sides*math.tau));v.append(q)
 for j in range(len(points)-1):
  for i in range(sides):a=j*sides+i;b=j*sides+(i+1)%sides;f.append((a,b,b+sides,a+sides))
 meshpart(v,f,mat,{bone:1})
# Shaped torso with waist, lumbar and chest contours. Padding sits inside the jersey silhouette.
loft([(0,.86,.015,.205,.137),(0,.94,.012,.232,.145),(0,1.02,.008,.241,.147),(0,1.10,0,.247,.151),(0,1.18,-.008,.266,.171),(0,1.27,-.014,.288,.183),(0,1.36,-.009,.318,.188),(0,1.43,0,.330,.174),(0,1.48,.003,.270,.153),(0,1.51,.006,.130,.108)],jersey,lambda y:{'Hips':max(0,min(1,(1.16-y)/.22)),'Chest':max(0,min(1,(y-.94)/.22))},48)
loft([(0,.80,0,.223,.15),(0,.90,0,.248,.165),(0,.96,0,.235,.148)],pants,'Hips',32)
loft([(0,1.48,0,.086,.084),(0,1.57,0,.079,.08),(0,1.64,0,.10,.10)],skin,'Neck',24)
ellipsoid((0,1.765,-.014),(.16,.21,.158),skin,'Head',32,20)
# Nose, brows and chin are understated behind the cage.
ellipsoid((0,1.765,-.167),(.031,.038,.028),skin,'Head',16,10)
ellipsoid((0,1.636,-.124),(.088,.045,.045),skin,'Head',20,10)
# Restrained original facial landmarks behind the facemask; no real athlete likeness.
for sign in [-1,1]:
 ellipsoid((sign*.058,1.804,-.157),(.027,.012,.011),glove,'Head',16,8)
 ellipsoid((sign*.058,1.803,-.167),(.008,.010,.005),shoe,'Head',12,8)
 tube([(sign*.032,1.824,-.159),(sign*.060,1.829,-.153),(sign*.084,1.821,-.139)],.006,shoe,'Head',6)
tube([(-.04,1.675,-.149),(0,1.668,-.166),(.04,1.675,-.149)],.0035,shoe,'Head',6)
# Helmet shell is an open-front loft with ear coverage, rim and vent slots; no team symbols.
v=[];f=[];N=48;R=20
for j in range(R+1):
 theta=.001+(math.pi*.72)*j/R
 for i in range(N):
  phi=i/N*math.tau;front=max(0,-math.sin(phi));limit=1-front*.20*(j/R)**4
  v.append((.218*math.sin(theta)*math.cos(phi),1.803+.243*math.cos(theta)*limit,.025+.227*math.sin(theta)*math.sin(phi)))
for j in range(R):
 for i in range(N):
  phi=(i+.5)/N*math.tau
  if j/R>.47 and math.sin(phi)<-.48:continue
  a=j*N+i;b=j*N+(i+1)%N;f.append((a,b,b+N,a+N))
meshpart(v,f,helmet,{'Head':1})
for sign in [-1,1]:
 ellipsoid((sign*.192,1.70,.025),(.04,.115,.125),helmet,'Head',24,14)
 # Chin strap from shell to chin, visually separate from facemask.
 tube([(sign*.195,1.70,-.02),(sign*.13,1.62,-.16),(sign*.055,1.60,-.175)],.007,glove,'Head',6)
for yy in [1.69,1.77]:tube([(-.19,yy,-.05),(-.206,yy,-.22),(-.12,yy-.01,-.278),(0,yy-.013,-.292),(.12,yy-.01,-.278),(.206,yy,-.22),(.19,yy,-.05)],.008,mask,'Head',10)
for xx in [-.11,.11]:tube([(xx,1.83,-.242),(xx,1.63,-.269),(xx*.65,1.60,-.18)],.007,mask,'Head',8)
ellipsoid((0,1.60,-.175),(.065,.032,.022),glove,'Head',20,10)
for sign in [-1,1]:
 side='Left' if sign<0 else 'Right';ua=side+'UpperArm';fa=side+'Forearm';hand=side+'Hand';th=side+'Thigh';sh=side+'Shin';ft=side+'Foot'
 # Arms rest just outboard in a relaxed A-pose, with continuous upper/forearm rings.
 sx=sign*.33;ex=sign*.415;wx=sign*.46
 ellipsoid((sx,1.414,.005),(.135,.103,.143),jersey,ua,32,16)
 loft([(sx,1.43,0,.114,.135),(sign*.355,1.35,0,.122,.129),(sign*.38,1.25,0,.105,.111),(ex,1.12,0,.076,.080)],skin,ua,28)
 loft([(sx,1.43,0,.125,.139),(sign*.35,1.36,0,.131,.133),(sign*.374,1.28,0,.116,.119)],jersey,ua,32)
 loft([(sign*.376,1.285,0,.118,.12),(sign*.38,1.265,0,.112,.115)],trim,ua,28)
 loft([(ex,1.14,0,.077,.081),(sign*.428,1.07,.002,.084,.08),(sign*.446,.97,0,.070,.061),(wx,.855,0,.044,.041)],skin,lambda y:{ua:max(0,min(1,(y-1.06)/.09)),fa:1-max(0,min(1,(y-1.06)/.09))},28)
 loft([(wx,.88,0,.047,.042),(wx,.84,0,.048,.042)],glove,fa,24)
 ellipsoid((wx,.792,-.003),(.055,.073,.031),glove,hand,24,14)
 for digit in range(4):
  x=wx+sign*(digit-1.5)*.022;length=[.073,.083,.081,.062][digit]
  tube([(x,.77,-.004),(x,.735,-.012),(x,.77-length,-.026)],.010,glove,hand,8)
 tube([(wx-sign*.048,.812,-.005),(wx-sign*.077,.785,-.025),(wx-sign*.08,.758,-.038)],.013,glove,hand,8)
 # Curved thigh and calf contours, knee-pad volume, ankle taper.
 x=sign*.135
 loft([(x,.92,0,.14,.15),(x,.82,0,.153,.15),(x,.70,.012,.14,.13),(x,.58,.015,.112,.105),(x,.475,0,.094,.097)],pants,th,32)
 ellipsoid((x,.505,-.06),(.093,.092,.060),pants,th,24,14)
 loft([(x,.49,0,.09,.088),(x,.39,.018,.098,.093),(x,.28,.028,.082,.08),(x,.17,.012,.056,.061),(x,.105,0,.051,.055)],glove,sh,28)
 # Cleats: heel cup, instep, toe box and low profile sole, rather than rectangular feet.
 ellipsoid((x,.086,-.065),(.084,.075,.157),shoe,ft,32,16)
 ellipsoid((x,.035,-.075),(.086,.016,.163),trim,ft,28,10)
 for zz in [-.18,-.10,.015]:
  for dx in [-.049,.049]:ellipsoid((x+dx,.014,zz),(.014,.014,.016),shoe,ft,10,6)
 for zz in [-.04,-.065,-.09]:tube([(x-.037,.148,zz),(x+.037,.148,zz)],.004,glove,ft,6)
# Create one mesh with material regions and a real armature, shared by all runtime instances.
mesh=bpy.data.meshes.new('AthleteSurface');mesh.from_pydata(verts,[],faces);mesh.update();bm=bmesh.new();bm.from_mesh(mesh);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(mesh);bm.free();obj=bpy.data.objects.new('AthleteBody',mesh);bpy.context.collection.objects.link(obj)
for m in materials:mesh.materials.append(m)
for polygon,mi in zip(mesh.polygons,face_mats):polygon.material_index=mi;polygon.use_smooth=True
arm=bpy.data.armatures.new('AthleteSkeleton');rig=bpy.data.objects.new('AthleteRig',arm);bpy.context.collection.objects.link(rig);bpy.context.view_layer.objects.active=rig;rig.select_set(True);bpy.ops.object.mode_set(mode='EDIT')
def bone(name,head,tail,parent=None):
 b=arm.edit_bones.new(name);b.head=B(head);b.tail=B(tail)
 if parent:b.parent=arm.edit_bones[parent]
 return b
bone('Root',(0,0,0),(0,.1,0));bone('Hips',(0,.89,0),(0,1.02,0),'Root');bone('Spine',(0,1.02,0),(0,1.23,0),'Hips');bone('Chest',(0,1.23,0),(0,1.49,0),'Spine');bone('Neck',(0,1.49,0),(0,1.64,0),'Chest');bone('Head',(0,1.64,0),(0,1.94,0),'Neck')
for sign in [-1,1]:
 side='Left' if sign<0 else 'Right'
 bone(side+'Shoulder',(0,1.45,0),(sign*.33,1.43,0),'Chest');bone(side+'UpperArm',(sign*.33,1.43,0),(sign*.415,1.12,0),side+'Shoulder');bone(side+'Forearm',(sign*.415,1.12,0),(sign*.46,.855,0),side+'UpperArm');bone(side+'Hand',(sign*.46,.855,0),(sign*.46,.725,-.012),side+'Forearm');bone(side+'Thigh',(sign*.135,.91,0),(sign*.135,.475,0),'Hips');bone(side+'Shin',(sign*.135,.475,0),(sign*.135,.09,0),side+'Thigh');bone(side+'Foot',(sign*.135,.09,0),(sign*.135,.04,-.20),side+'Shin')
bpy.ops.object.mode_set(mode='OBJECT');obj.parent=rig;modifier=obj.modifiers.new('Athlete deformation','ARMATURE');modifier.object=rig
for name in arm.bones.keys():obj.vertex_groups.new(name=name)
for i,w in enumerate(weights):
 total=sum(w.values()) or 1
 for name,value in w.items():
  if value>0:obj.vertex_groups[name].add([i],value/total,'REPLACE')
# Code-driven positions only: all clips are in place. Blend animation actions at runtime.
rig.animation_data_create();scene=bpy.context.scene;scene.render.fps=30;scene.frame_start=1;scene.frame_end=31
for pb in rig.pose.bones:pb.rotation_mode='XYZ'
def pose(frame,kind,keyframe=None):
 for pb in rig.pose.bones:pb.rotation_euler=(0,0,0);pb.location=(0,0,0)
 t=(frame-1)/30;wave=math.sin(t*math.tau)
 def rx(name,angle):rig.pose.bones[name].rotation_euler.x=angle
 if kind in ['RUN','SPRINT','BACKPEDAL']:
  power=.65 if kind=='SPRINT' else .48;direction=-1 if kind=='BACKPEDAL' else 1
  for side,offset in [('Left',0),('Right',math.pi)]:
   swing=math.sin(t*math.tau+offset)*power*direction;rx(side+'Thigh',swing);rx(side+'Shin',-max(0,swing)*1.3-.06);rx(side+'Foot',-swing*.35);rx(side+'UpperArm',-swing*.9);rx(side+'Forearm',.95)
  rx('Spine',-.06);rig.pose.bones['Hips'].location.z=abs(wave)*.016
 elif kind=='QB_THROW':
  rx('RightUpperArm',-.35+1.9*math.sin(min(t,1)*math.pi*.72));rx('RightForearm',1.9*(1-t)+.2);rx('LeftUpperArm',.6);rx('LeftForearm',1.4);rig.pose.bones['Chest'].rotation_euler.y=.25*math.sin(t*math.pi)
 elif kind=='CATCH':
  for side in ['Left','Right']:rx(side+'UpperArm',1.1);rx(side+'Forearm',.65);rig.pose.bones[side+'UpperArm'].rotation_euler.z=.20 if side=='Left' else -.20
 elif kind=='BLOCK':
  rx('Spine',-.15)
  for side in ['Left','Right']:rx(side+'UpperArm',1.0);rx(side+'Forearm',.45)
 elif kind=='CELEBRATION':
  rx('RightUpperArm',2.7);rx('RightForearm',.25);rx('LeftUpperArm',1.9);rx('LeftForearm',.45)
 elif kind=='TACKLE':
  rx('Root',-1.15*t)
  for side in ['Left','Right']:rx(side+'UpperArm',.85);rx(side+'Forearm',1.1);rx(side+'Thigh',.35*t);rx(side+'Shin',-.6*t)
 else:
  rx('Spine',wave*.008)
  for side in ['Left','Right']:rx(side+'UpperArm',.12);rx(side+'Forearm',1.7 if kind=='QB_STANCE' else .25)
 for pb in rig.pose.bones:pb.keyframe_insert(data_path='rotation_euler',frame=keyframe or frame);pb.keyframe_insert(data_path='location',frame=keyframe or frame)
clip_names=['IDLE','QB_STANCE','RUN','SPRINT','BACKPEDAL','QB_THROW','CATCH','BLOCK','TACKLE','CELEBRATION']
# Bake a single library timeline, then split exact one-second clips in the game.
# This avoids cloud-export NLA merging ambiguity and never moves the gameplay root.
for track in list(rig.animation_data.nla_tracks):rig.animation_data.nla_tracks.remove(track)
action=bpy.data.actions.new('FOOTBALL_LIBRARY');rig.animation_data.action=action
for index,kind in enumerate(clip_names):
 for frame in range(1,32,3):pose(frame,kind,index*60+frame)
scene.frame_end=571;scene.frame_set(1)
# Decimated variants retain vertex groups, materials and armature binding.
for level,ratio in [(1,.47),(2,.20)]:
 lod=obj.copy();lod.data=obj.data.copy();lod.name='AthleteBody_LOD'+str(level);bpy.context.collection.objects.link(lod)
 for mod in list(lod.modifiers):lod.modifiers.remove(mod)
 bpy.context.view_layer.objects.active=lod;lod.select_set(True)
 dec=lod.modifiers.new('LOD reduction','DECIMATE');dec.ratio=ratio;dec.use_collapse_triangulate=True
 bpy.ops.object.modifier_apply(modifier=dec.name)
 skinmod=lod.modifiers.new('Athlete deformation','ARMATURE');skinmod.object=rig
 lod.hide_render=True
obj.name='AthleteBody_LOD0'
# Neutral portable studio lights, original asset only. Camera frames feet and helmet.
scene.world=bpy.data.worlds.new("StudioWorld") if scene.world is None else scene.world
scene.world.color=(.12,.12,.12)
for name,pos,energy,size in [('Key',(-3,4,5),1100,4),('Fill',(3,2,3),600,3),('Rim',(1,-3,4),800,2)]:
 light=bpy.data.lights.new(name,'POINT');light.energy=energy;light.shadow_soft_size=size*.25;o=bpy.data.objects.new(name,light);bpy.context.collection.objects.link(o);o.location=pos;o.rotation_euler=(Vector((0,0,1))-o.location).to_track_quat('-Z','Y').to_euler()
camdata=bpy.data.cameras.new('AssetReviewCamera');cam=bpy.data.objects.new('AssetReviewCamera',camdata);bpy.context.collection.objects.link(cam);cam.location=(2.5,4.6,2.0);cam.rotation_euler=(Vector((0,0,.98))-cam.location).to_track_quat('-Z','Y').to_euler();camdata.type='ORTHO';camdata.ortho_scale=2.35;scene.camera=cam
scene.render.engine='BLENDER_EEVEE';scene.render.resolution_x=640;scene.render.resolution_y=800;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG';scene.render.image_settings.media_type='IMAGE';target=artifacts.file(name='original-athlete-rest.png',media_type='image/png');scene.render.filepath=target.path;bpy.ops.render.render(write_still=True);target.publish()
mesh.calc_loop_triangles();result={'vertices':len(mesh.vertices),'triangles':len(mesh.loop_triangles),'materials':[m.name for m in materials],'bones':len(arm.bones),'clips':clip_names,'clip_frames':[(k,i*60,i*60+30) for i,k in enumerate(clip_names)],'lods':[(o.name,len(o.data.polygons)) for o in bpy.data.objects if o.type=='MESH'],'height_m':1.90,'source':'Original code-authored mesh in Higgsfield cloud Blender; not a generative-model output','render':'original-athlete-rest.png'}
