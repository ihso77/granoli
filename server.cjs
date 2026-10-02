require('dotenv').config();
const express=require('express');
const cors=require('cors');
const path=require('path');
const fs=require('fs');
const {createClient}=require('@supabase/supabase-js');
const app=express();
const PORT=process.env.PORT||3000;

const supabase=createClient(
  'https://pddztwfnwnubaztrwlss.supabase.co',
  'sb_publishable_JXi6qcniYgiZ72TGgB2xcA_YIbOuZUD'
);

app.use(cors());
app.use(express.json());

const DIST_DIR = path.join(__dirname, 'dist');
const STATIC_DIR = fs.existsSync(DIST_DIR) ? DIST_DIR : __dirname;
app.use(express.static(STATIC_DIR));

app.post('/api/orders',async(req,res)=>{
  try{
    const order=req.body;
    const items=Array.isArray(order.items)?order.items:[];
    for(const item of items){
      if(!item.productId||!item.qty)continue;
      let ok=true;
      try{
        const {data,error}=await supabase.rpc('decrement_stock',{p_id:item.productId,p_qty:Number(item.qty)||1});
        if(error)throw error;
        if(data===false)ok=false;
      }catch{
        const {data:prod}=await supabase.from('products').select('stock').eq('id',item.productId).single();
        if(prod&&prod.stock!=null){
          if(prod.stock<(Number(item.qty)||1))ok=false;
          else{
            const {error:upErr}=await supabase.from('products').update({stock:prod.stock-(Number(item.qty)||1)}).eq('id',item.productId);
            if(upErr)ok=false;
          }
        }
      }
      if(!ok)throw new Error('الكمية غير كافية للمنتج '+item.productId);
    }
    order.id='ORD-'+Date.now();
    order.created_at=new Date().toISOString();
    order.status='pending';
    const orders=JSON.parse(fs.readFileSync(path.join(__dirname,'orders.json'),'utf8'));
    orders.push(order);
    fs.writeFileSync(path.join(__dirname,'orders.json'),JSON.stringify(orders,null,2));
    res.json({success:true,orderId:order.id});
  }catch(err){
    res.status(500).json({error:err.message});
  }
});

app.get('/api/orders',(_req,res)=>{
  try{
    const orders=JSON.parse(require('fs').readFileSync(path.join(__dirname,'orders.json'),'utf8'));
    res.json(orders);
  }catch{
    res.json([]);
  }
});

app.get('/api/orders/:id',(req,res)=>{
  try{
    const orders=JSON.parse(require('fs').readFileSync(path.join(__dirname,'orders.json'),'utf8'));
    const order=orders.find(o=>o.id===req.params.id);
    if(order)res.json(order);
    else res.status(404).json({error:'Not found'});
  }catch{
    res.status(404).json({error:'Not found'});
  }
});

app.put('/api/orders/:id',(req,res)=>{
  try{
    const orders=JSON.parse(require('fs').readFileSync(path.join(__dirname,'orders.json'),'utf8'));
    const idx=orders.findIndex(o=>o.id===req.params.id);
    if(idx===-1)return res.status(404).json({error:'Not found'});
    orders[idx]={...orders[idx],...req.body};
    require('fs').writeFileSync(path.join(__dirname,'orders.json'),JSON.stringify(orders,null,2));
    res.json(orders[idx]);
  }catch(err){
    res.status(500).json({error:err.message});
  }
});

if(!require('fs').existsSync(path.join(__dirname,'orders.json'))){
  require('fs').writeFileSync(path.join(__dirname,'orders.json'),'[]');
}

app.get('*',(_req,res)=>{
  const index = path.join(STATIC_DIR, 'index.html');
  res.sendFile(fs.existsSync(index) ? index : path.join(__dirname, 'index.html'));
});

app.listen(PORT,()=>{
  console.log(`GRANOLI server running on http://localhost:${PORT}`);
});