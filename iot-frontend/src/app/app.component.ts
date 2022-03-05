import { Component, Input, ViewChild } from '@angular/core';
import { OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ChartConfiguration, ChartEvent } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  cmd: string | undefined;
  message = "msg";
  speechRecognition: any;
  ultimaTemperatura: any | number;
  ultimaUmidade: any | number;
  alertaAtivado: boolean = false;
  dadosAlerta={variavel:"", condicao:"", value:""};
  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;
  dadosClima={"cidade":"", "clima":"", "temp_min":"", "temp_max":"", "vento_vel":""};
  apiadvisorToken= "xxxxxxxxxxxxxxxxxxxxxxx";
 
  constructor(private http: HttpClient) {}

  lineChartData: ChartConfiguration['data'] = {
    datasets: [
      {
        data: [  ],
        label: 'Temperatura Cº',
        
        backgroundColor: 'rgba(255,0,0,0.3)',
        borderColor: 'red',
        pointBackgroundColor: 'red',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(67,114,191,0.8)',
        fill: 'origin',
      },
      {
        data: [ ],
        label: 'Umidade %',
        yAxisID: 'y-axis-1',
        backgroundColor: 'rgba(67,114,191,0.2)',
        borderColor: 'rgba(67,114,191,1)',
        pointBackgroundColor: 'rgba(67,114,191,1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(67,114,191,0.8)',
        fill: 'origin',
      }
      
    ]
  }

  enviarCmdIot(value: string) {
    return this.http.get("http://192.168.0.159:5000/enviar_cmd_iot/" + value).subscribe();
  }

  getDadosClima() {
    var that = this;
    this.http.get("https://api.openweathermap.org/data/2.5/weather?q=s%C3%A3o%20paulo&units=metric&lang=pt_br&appid="+this.apiadvisorToken).subscribe(
      (result)=>{
       
        //@ts-ignore
        that.dadosClima.clima = result.weather[0].description;//@ts-ignore
        that.dadosClima.cidade = result.name;//@ts-ignore
        that.dadosClima.temp_min = result.main.temp_min;//@ts-ignore
        that.dadosClima.temp_max = result.main.temp_max;//@ts-ignore
        that.dadosClima.vento_vel = result.wind.speed;

        var msg = "Olá, hoje o clima em " + that.dadosClima.cidade;
        msg += " é de " +that.dadosClima.clima;
        msg += " e vento com velocidade de" +that.dadosClima.vento_vel +" metros por segundo";
        msg += " com temperatura mínima de " +that.dadosClima.temp_min + " graus";
        msg += " e máxima de " +that.dadosClima.temp_max+ " graus";

        that.falarTexto(msg);

        console.log(result);
      }
    );
  }

  falarTexto(txt="Bom dia"){
    window.speechSynthesis.cancel();
    var spMsg = new SpeechSynthesisUtterance(txt);  
    spMsg.voice = window.speechSynthesis.getVoices()[1]
    window.speechSynthesis.speak(spMsg);
    return;
  }
  getDadosGrafico() {
    var that = this;
    this.http.get("http://192.168.0.159:5000/get_dados_grafico").subscribe(
      (result)=>{
        //@ts-ignore
        that.ultimaTemperatura = result.temperatura[result.temperatura.length-1]
        //@ts-ignore
        that.ultimaUmidade = result.umidade[result.umidade.length-1]

        //@ts-ignore
        that.lineChartData.datasets[0].data = result.temperatura;
        //@ts-ignore
        that.lineChartData.datasets[1].data = result.umidade;
        //@ts-ignore
        that.lineChartData.labels = result.hora;
        
        that.chart?.update();
        console.log(result);
        this.verificarAlerta();
      }
    );
  }

  verificarAlerta(){
    var al = this.dadosAlerta;
    var um = al.variavel == "temperatura"?" graus":" porcento";
    var msg = "Atenção, a "+al.variavel+" é "+al.condicao+" que " + al.value +um;
    this.alertaAtivado = false;

    if(al.variavel != "" && al.condicao != "" && al.value != ""){
      if(al.condicao == "menor" && al.variavel == "temperatura"){
        if(this.ultimaTemperatura <= al.value){
          this.alertaAtivado = true;
          this.falarTexto(msg);
        }
      }
      else if(al.condicao == "menor" && al.variavel == "umidade"){
        if(this.ultimaUmidade <= al.value){
          this.alertaAtivado = true;
          this.falarTexto(msg);
        }
      }
      else if(al.condicao == "maior" && al.variavel == "temperatura"){
        if(this.ultimaTemperatura >= al.value){
          this.alertaAtivado = true;
          this.falarTexto(msg);
        }
      }
      else if(al.condicao == "maior" && al.variavel == "umidade"){
        if(this.ultimaUmidade >= al.value){
          this.falarTexto(msg);
          this.alertaAtivado = true;
        }
      }
    }
  }

  gravarCmd(){
    var that =  this;
    setTimeout(async function () {
      that.speechRecognition.start();
      console.log("init");
    }, 1000);

    setTimeout(async function () {
      that.speechRecognition.stop();
      console.log("fim");
    }, 10000);
  }

  acionaAutoRefreshGrafico(){
    var that = this;
    that.getDadosGrafico();
    setInterval(()=>{that.getDadosGrafico()},30000);
  }

  ngOnInit(): void {
    var that = this;
    setTimeout(function(){
      that.falarTexto();
    },3000);
    
    this.acionaAutoRefreshGrafico();
    var that = this;
    //@ts-ignore
    this.speechRecognition = new window.webkitSpeechRecognition();

    this.speechRecognition.onresult = function (r: any) {
      var res_t = r.results[0].item(0).transcript
      that.message = res_t;
      console.log('Audio capturing ended');
      console.log(that.message);

      var lpalavras = that.message.toLowerCase().split(" ");

      var isofia = lpalavras.indexOf("sofia")
        if (lpalavras.length >= isofia + 1) {
          if (lpalavras.map((x)=>["off","apagar","desligar", "apague","desligue"].includes(x)).reduce((x,y)=>(x==true||y==true))) {
            that.cmd = "off";
            that.enviarCmdIot(that.cmd);
          } else if (lpalavras.map((x)=>["on","acender","ligar", "ligue","acenda"].includes(x)).reduce((x,y)=>(x==true||y==true))) {
            that.cmd = "on";
            that.enviarCmdIot(that.cmd);
          }else if (lpalavras.map((x)=>["clima","previsão","tempo"].includes(x)).reduce((x,y)=>(x==true||y==true))) {
            that.getDadosClima();
          }
        }
    }

  }

  // funcoes do grafico

  public lineChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    elements: {
      line: {
        tension: 0.5
      }
    },
    scales: {
      x: {},
      'y-axis-0':
        {
          min: 0,
          max: 100,
          position: 'left',
          grid: {
            color: 'rgba(255,0,0,0.3)',
          },
          ticks: {
            
            color: 'red'
          }
        },
      'y-axis-1': {
        min: 0,
        max: 100,
        position: 'right',
        grid: {
          color: 'rgba(67,114,191,1)',
        },
        ticks: {
          color: 'rgba(67,114,191,1)'
        }
      }
    },

    plugins: {
      legend: { display: true },//@ts-ignore
      annotation: {
        annotations: [
          {
            type: 'line',
            scaleID: 'x',
            value: 'March',
            borderColor: 'orange',
            borderWidth: 2,
            label: {
              position: 'center',
              enabled: true,
              color: 'orange',
              content: 'LineAnno',
              font: {
                weight: 'bold'
              }
            }
          },
        ],
      }
    }
  };

}