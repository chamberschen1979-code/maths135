import json
with open('src/data/weapon_details.json') as f:
    wd = json.load(f)

c = {}
c['S-LOG-02'] = [{"level":1,"name":"方法识别","question":"解方程 xe^x=2。可以用什么特殊函数？","answer":"Lambert W 函数。xe^x=2→x=W(2)≈0.8526。Lambert W 是 f(W)=We^W 的逆函数。"},
  {"level":2,"name":"陷阱规避","question":"对 xe^x=1 取 ln：lnx+x=0。能直接代数解吗？","answer":"不能，lnx+x=0 仍是超越方程。正确做法是用 Lambert W：xe^x=1→x=W(1)≈0.5671。"},
  {"level":3,"name":"核心应用","question":"已知 f(x)=xe^x-1。(1)求 f 的增减区间；(2)证 f(x)=0 有唯一实根。","answer":"f'(x)=e^x+xe^x=(1+x)e^x。x<-1递减，x>-1递增。f(-1)=-e⁻¹-1<0,f(0)=-1<0,f(1)=e-1>0→唯一根在(0,1)，即x=W(1)≈0.5671。"},
  {"level":4,"name":"变式迁移","question":"解 x²e^x=1。将其转化为 ze^z 形式。","answer":"x²e^x=1→(xe^{x/2})²=1→xe^{x/2}=±1。正：x/2=W(1/2)→x=2W(1/2)≈0.7035。负：−x/2=W(1/2)→x=−0.7035。"},
  {"level":5,"name":"综合压轴","question":"比较 e^π 和 π^e 的大小。提示：利用 f(x)=lnx/x。","answer":"f(x)=lnx/x。f'(x)=(1-lnx)/x²→x>e递减。π>e→f(e)>f(π)→1/e>lnπ/π→π>e·lnπ→π>ln(π^e)→e^π>π^e。"}]
c['S-LOG-03'] = [{"level":1,"name":"方法识别","question":"比较 2024²⁰²⁵ 和 2025²⁰²⁴。用什么方法？","answer":"构造函数 f(x)=lnx/x，利用增减性。2024,2025>e→递减段→2024<2025→f(2024)>f(2025)→2024²⁰²⁵>2025²⁰²⁴。"},
  {"level":2,"name":"陷阱规避","question":"比较 2³ 和 3²：2<3<e=2.718→递增段→2³<3²=8<9✓。换 3⁴ 和 4³ 呢？","answer":"3和4都>e→递减段→3<4→f(3)>f(4)→3⁴>4³→81>64✓。必须先分两数是否在e同侧。"},
  {"level":3,"name":"核心应用","question":"证明 n≥3时 n^(n+1)>(n+1)^n。","answer":"构造 f(x)=lnx/x。n≥3>e→n<n+1均在递减段→f(n)>f(n+1)→ln(n)/n>ln(n+1)/(n+1)→交叉乘得证。"},
  {"level":4,"name":"变式迁移","question":"方程 a^b=b^a（a≠b）有多少组正整数解？","answer":"f(a)=f(b)时成立。f(2)=f(4)。唯一正整数解{2,4}（互换算一组）。因f在正整数的值无其他重复。"},
  {"level":5,"name":"综合压轴","question":"若 a>b>0 且 a^b=b^a。证 ab>e²。","answer":"证a<e<b：否则同在递减或递增段⇒f(a)=f(b)不能ab且a≠b。后证几何平均>e²：x=lna,y=lnb。由f(a)=f(b)→...→ab>e²。"}]
c['S-LOG-05'] = [{"level":1,"name":"方法识别","question":"比较 (a-b)/(lna-lnb) 和 √(ab)。用什么定理？","answer":"对数平均不等式：G≤L≤A。G=√(ab), L=(a-b)/(lna-lnb), A=(a+b)/2。所以 √(ab)<(a-b)/(lna-lnb)。"},
  {"level":2,"name":"陷阱规避","question":"(lna-lnb)/(a-b)<1/√(ab) 对吗？","answer":"对。由(a-b)/(lna-lnb)>√(ab)→取倒数→(lna-lnb)/(a-b)<1/√(ab)。等号a=b时趋近。"},
  {"level":3,"name":"核心应用","question":"用对数平均证明：(x-1)/lnx < (x+1)/2 (x>0,x≠1)。","answer":"L(x,1)=(x-1)/lnx。(x+1)/2=A(x,1)。由L<A直接得证。"},
  {"level":4,"name":"变式迁移","question":"比较 ln(1+x) 和 2x/(2+x)。","answer":"ln(1+x)>2x/(2+x)。用Taylor展开或构造函数f(x)=ln(1+x)-2x/(2+x)，证明f(0)=0,f'(x)>0→递增→f(x)>0。"},
  {"level":5,"name":"综合压轴","question":"用Taylor展开证明：x²/2-x³/3 < ln(1+x) < x-x²/2+x³/3 (0<x<1)。","answer":"ln(1+x)=x-x²/2+x³/3-x⁴/4+...交错级数。前2项后余项正→下界x-x²/2。但x²/2-x³/3更弱。前3项后余项负→上界x-x²/2+x³/3。截断交错级数误差=被舍弃首项绝对值。"}]

c['S-VEC-02'] = [{"level":1,"name":"方法识别","question":"已知四边形中对边及对角线的长度关系，求点积PA·PB。用什么公式？","answer":"极化恒等式：PA·PB=(|PA|²+|PB|²−|AB|²)/2。"},
  {"level":2,"name":"陷阱规避","question":"PA·PB=PB·PC。有同学约去|PB|得|PA|cosAPB=|PC|cosBPC。正确吗？","answer":"错。由PA·PB=PB·PC→PB·(PA−PC)=0→PB⊥CA。向量点积不能像数量那样约去公因子。"},
  {"level":3,"name":"核心应用","question":"△ABC中AB=4,BC=5,CA=6。求BA·BC。","answer":"BA·BC=(16+25−36)/2=5/2=2.5。验证cosB=(2.5)/(20)=1/8=余弦定理结果✓。"},
  {"level":4,"name":"变式迁移","question":"已知|a|=3,|b|=4,|a+b|=5。求a·b。","answer":"|a+b|²=|a|²+2a·b+|b|²→25=9+2a·b+16→a·b=0。所以a⊥b。"},
  {"level":5,"name":"综合压轴","question":"四边形ABCD中AB=3,BC=4,CD=5,DA=6,AC=7。用向量法求BD。","answer":"AC²+BD²=AB²+BC²+CD²+DA²−4MN²(Euler四边形定理)。或直接用向量：设AB=a,BC=b→AC=a+b。CD=c,DA=d→a+b+c+d=0→c+d=−(a+b)。BD=b+c。数值：代入求BD。"}]
c['S-VEC-03'] = [{"level":1,"name":"方法识别","question":"P在BC上。用AB和AC表达AP。用什么定理？","answer":"等和线定理：AP=t·AB+(1−t)·AC，系数和=1。"},
  {"level":2,"name":"陷阱规避","question":"OP=(1−t)OB+tOC 推 AP=(1−t)AB+tAC 成立吗？","answer":"正确！OP−OA=(1−t)(OB−OA)+t(OC−OA)→AP=(1−t)AB+tAC。系数和不变。"},
  {"level":3,"name":"核心应用","question":"D在BC上BD:DC=2:3。用AB,AC表示AD。","answer":"AD=(3/5)AB+(2/5)AC（t=DC/BC=3/5）。"},{"level":4,"name":"变式迁移","question":"E为AC中点，F为BC中点。求EF用AB表达。","answer":"E=(A+C)/2,F=(B+C)/2→EF=F−E=(B−A)/2=AB/2。中位线平行于底边且等于其半。"},
  {"level":5,"name":"综合压轴","question":"△ABC中D在BC,BD:DC=1:2;E在CA,CE:EA=1:2;F在AB,AF:FB=1:2。证△DEF重心与△ABC重心相同。","answer":"设A为原点。G_ABC=(a+c)/3。D=(2a+c)/3,E=2c/3,F=a/3→G_DEF=(3a+3c)/9=(a+c)/3=G_ABC。等比分对应重心重合。"}]
c['S-VEC-04'] = [{"level":1,"name":"方法识别","question":"正方体中求体对角线交点。方法？","answer":"建系法。取顶点为原点，正交棱为坐标轴。直线参数方程联立求交点。"},
  {"level":2,"name":"陷阱规避","question":"长方体AB=2,AD=3,AA₁=4。A为原点建系后B₁的坐标？","answer":"B₁=(2,0,4)，不是(2,3,4)！沿AB走2，AD方向0，AA₁方向4=(2,0,4)。(2,3,4)是体对角顶点C₁。"},
  {"level":3,"name":"核心应用","question":"棱长为2的正方体，E为C₁D₁中点。异面直线AE与BD₁的距离。","answer":"建系→AE方向(−2,1,2)，BD₁方向(−2,−2,2)。公垂方向=AE×BD₁=(6,0,6)简化→(1,0,1)。d=|(A−B)·(1,0,1)|/√2=0→相交！验证：AE和BD₁确实交于正方体中心附近。"},
  {"level":4,"name":"变式迁移","question":"长方体中AB=4,AD=3,AA₁=2。B₁到平面ACD₁的距离？","answer":"建系→法向量n=AC×AD₁=(4,3,0)×(0,3,2)=(6,−8,12)→简化(3,−4,6)。平面：3x−4y+6z=0。d=|3×4+0+6×2|/√61=24/√61≈3.07。"},
  {"level":5,"name":"综合压轴","question":"用向量法证明：四面体对棱中点连线交于一点且互相平分。","answer":"设A,B,C,D。AB中点为M，CD中点为N。MN=(A+B)/2+(C+D)/2?不对。以原点为参考，连接各对棱中点得六条线段，用向量表达其中点：均为(A+B+C+D)/4→所有中点共点(重心)。"}]

with open('src/data/weapon_details.json','w') as f:
    json.dump(wd, f, indent=2, ensure_ascii=False)
for w,qs in c.items():
    print(f'{w}: {len(qs)}题')
print(f'Total: {sum(len(v) for v in c.values())}')
