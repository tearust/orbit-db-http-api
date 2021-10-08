## Provider需要用的api

server端口是6001

### /identity
```
{
  method: 'GET',
}
```

### /tapp/views/put
```
{
  method: 'POST',
  body: {
    tapp_id // tapp id
    count // view number
    time // timestamp, 
    block // optional, layer1 block number.
  }
}
```

### /tapp/views/get?tapp_id={1}
```
{
  method: 'GET',
}

```

------------
## Return data
```
// success
{
  code: 1,
  data: {data}  
}

// fail
{
  code: -1,
  error: {error}
}

```