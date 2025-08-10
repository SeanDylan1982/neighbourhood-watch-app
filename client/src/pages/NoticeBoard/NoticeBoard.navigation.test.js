/**
 * Test file specifically for NoticeBoard back navigation functionality
 * This focuses on testing the back button behavior according to requirements 10.1, 10.2, 10.3
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import NoticeBoard from './NoticeBoard';

// Mock all the complex dependencies
jest.mock('../../components/Common/Icons', () => ({
  __esModule: true,
  default: {
    NoticeBoard: () => <div data-testid="notice-icon">NoticeBoard Icon</div>,
    Warning: () => <div data-testid="warning-icon">Warning Icon</div>,
    Add: () => <div data-testid="add-icon">Add Icon</div>,
    MoreVert: () => <div data-testid="more-icon">MoreVert Icon</div>,
    ThumbUp: () => <div data-testid="thumbup-icon">ThumbUp Icon</div>,
    Comment: () => <div data-testid="comment-icon">Comment Icon</div>
  }
}));

jest.mock('../../hooks/useTermsAcceptance', () => ({
  __esModule: true,
  default: () => ({
    canPostNotice: true,
    acceptTerms: jest.fn(),
    loading: false,
    error: null
  })
}));

jest.mock('../../hooks/useViewPreference', () => ({
  __esModule: true,
  default: jest.fn(() => ['grid', jest.fn()])
}));

jest.mock('../../components/Common/Toast', () => ({
  useToast: () => ({
    showToast: jest.fn()
  }),
  ToastProvider: ({ children }) => children
}));

jest.mock('../../components/Upload', () => ({
  ImageUpload: () => <div data-testid="image-upload">Image Upload</div>,
  MediaPreview: () => <div data-testid="media-preview">Media Preview</div>
}));

jest.mock('../../components/Common/ImageThumbnail', () => ({
  ImageThumbnailGrid: () => <div data-testid="image-thumbnails">Image Thumbnails</div>
}));

jest.mock('../../components/Welcome/NoticeBoardWelcomeMessage', () => 
  () => <div data-testid="welcome-message">Welcome Message</div>
);

jest.mock('../../components/Comm
}); });estore();
 eSpy.mockRnsolco
    ;
or))(Errany expect.gered:',allback trigon fgativiWith('NaeenCalledoHaveBonsoleSpy).tt(cxpeces');
    e'/noticdWith(alleBeenCoHaveigate).tav(mockN
    expectog warningllback and lst as fa notices li navigate to Should
    //ckButton);
baEvent.click(fire
     back buttonlick the/ C    /
  );
)
  back/i }/←  name: button', {yRole('screen.getB 
      itFor(() =>await wa =  backButtonconst  appear
  tton to nd back bu load atice tono the / Wait for]);

    /s/notice-1'otice/nouter(['WithR    render   });

 true
 rable:    configu
  );
      },or's errcesr acror('Referrehrow new Er        t) => {
et: (
      gferrer', {ocument, 'reeProperty(d.defin
    Objectw an errorthroer to eferrdocument.rk Moc //  {});

   tion(() =>taemen').mockImpl'warnnsole, n(cospyOest. jleSpy =t conso   cons
 andling error hifyto ver.warn nsoleck co  // Mo;

  ce-1' })tino: 'lue({ idReturnVa.mockrams
    usePaw) (detail vieticea single noiewing Mock v
    // () => {lly', async  gracefuation errorsavign handles n butto  test('back

;
  });notices')th('/CalledWiene).toHaveBegatt(mockNavi
    expeclback as falnotices listigate to  Should nav //ton);

   ckButick(bareEvent.clton
    fiback buthe k t/ Clic /       );

k/i })
: /← bacton', { nameyRole('butscreen.getB 
      itFor(() => await wautton =st backBar
    conappe button to oad and backto lthe notice / Wait for  /);

   /notice-1']ices['/notthRouter( renderWi   

   }); true
 igurable:
      confvalue: '',, {
      er'rrent, 'refeerty(documdefinePropect. Objferrer
    no remulate sierrer tocument.refk do/ Moc

    /' }); 'notice-1alue({ id:ockReturnV.museParams    ew)
tail vinotice (dengle  siwing a// Mock vie=> {
    ync () , asement 10.3)'rrer (Requirhen no refeices list wes to notavigat button nback  test('});

tices');
  ledWith('/nonCale).toHaveBeegatviNa expect(mockallback
   s list as fnoticeigate to d nav    // Shoul

utton);ckBnt.click(ba   fireEvetton
 the back bu   // Click    );

 ck/i })
  /← baname:', { ole('buttonreen.getByR    sc 
  itFor(() =>wa = await backButtononst   cear
  tton to appack bu load and bce to notiait for the

    // W']);/notice-1icester(['/notenderWithRou
    r  });

  ee: trunfigurabl    co
  l-site.com',terna 'https://ex    value:
  eferrer', {ent, 'rdocumperty(ct.definePro Obje  
 accessr or direct  referre externalulate simer toeferr.rdocument/ Mock 
    /ice-1' });
{ id: 'notnValue(ms.mockReturara
    usePil view)e (detaingle noticg a sin Mock view   //) => {
 ync (as0.3)', irement 1 (Requrrerfeal reen no internst who notices lites tgaon navibutt'back est();

  t  });
dWith(-1nCalleBeeate).toHaveigavect(mockN
    exptory (-1) hissing browserack ute bavigaShould n/   /n);

  ck(backButtoent.clieEvon
    fir back buttlick the    // C
    );

k/i })me: /← bac { nan',tto('buByRole screen.get => 
     itFor(()wa = await Button  const backpear
   apbutton to back o load and t noticeor theit f
    // Wa);
otice-1']es/noticr(['/nthRouterenderWi;

    rue
    })e: tnfigurabl
      co',notices000/:3localhosthttp://  value: '
    , {rer''refert, (documennePropertyObject.defi   
 hin the apping from witimulate comferrer to st.rek documen/ Moc;

    /' })otice-1{ id: 'nue(turnValockReseParams.m
    uw)ail vienotice (dete inglng a swi// Mock vie
    ) => {nc ()', asy 10.2quirementists (Reer exreferrpage when revious iate pproprgates to ap navik button('bac  test);

);
  }oBeEnabled(kButton).tct(bac
    expecument();Don).toBeInThe(backButtopect  exsible)
  nd vi(clickable actional ton is funbutck  ba  // Verify;
    
   ))
   ck/i }name: /← baton', { ut('bByRoleet   screen.g
   > itFor(() =waait n = awtot backBut
    conson to appearnd back butt aadtice to lonor the foait // W]);

    ice-1'/notices/notouter(['enderWithR});

    re-1'  'notice({ id:kReturnValuParams.mocew)
    useetail vie notice (dglng a sinewick vi Mo//  => {
  () 1)', async rement 10. (Requid sectione boarl in notictionais funcutton t('back btes
  
});();
  ks.clearAllMoc   jest) => {
 Each((
  after;
  });
)
    })Noticesolve(mock> Promise.re json: () =
       ok: true,   
 lvedValue({mockReso fetch.  
 
: []
    };   media[],
    comments: 
     ikes: [],     l
 nt: 5,ewCoue,
      vi falsinned:,
      isPng()toISOStriw Date().dAt: ne    create  },
     e: 'Doe'
 lastNam
        e: 'John',stNamir{
        fhorId:    aut
   'normal',y: iorit   preral',
   : 'gen  category
    ent',ntest cot: 'T     conten',
 oticet NTes: 'title,
      e-1'_id: 'notic= {
      ce Noti const mockfetch
   notice ful ccessock su  // M  
  ken');
  , 'mock-to('token'.setItemcalStorager();
    lockCleamoe.kNavigat   moc();
 arClecketch.mo   f> {
 reEach(() =
  befo', () => {igationton NavBack ButeBoard e('Noticscrib
};

deer>
  );outmoryR    </Meer>
ThemeProvid </d />
     oareB      <Notice}>
  hem theme={tProvider     <Theme>
 ries}tialEntntries={inier initialEyRoutor
    <Memrender({
  return ']) => '/noticesEntries = [alr = (initiderWithRouteconst ren-dom');

-routerquire('react} = rearams sePonst { u);

ct.fn()
})jesams: ,
  useParNavigate mock=>() e:   useNavigater-dom'),
('react-routuireActualjest.req
  ...) => ({-dom', (erct-routreat.mock('
jes); = jest.fn(mockNavigate

const me(); = createThest themefn();

conjest..fetch = balgloMock fetch


// iv>
);Action</dPin ">"pin-actionta-testid==> <div da) 
  () => tion', (Common/PinAcnts//../compone('..st.mock;

je
)Icon</div>Pin icon">"pin-d=a-testidiv dat <
  () =>) => Icon', (s/Common/Pinomponent'../../c
jest.mock(;
v>
)le</di">View Toggtogglestid="view-ta-te da) => <div
  (e', () => ewTogglViViewToggle/ents/Common/./../compont.mock('.

jesiv>
);s Modal</dodal">Termid="terms-mata-testv d  () => <di', () => 
Modalerms/Tts/Legalcomponenock('../../

jest.m</div>
);Statey te">Empty-staestid="emptdiv data-t() => <=> 
  State', () on/Empty