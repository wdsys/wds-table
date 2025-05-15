// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';

import { Tooltip } from 'antd';

import {
  CloseOutlined,
} from '@ant-design/icons';

import './VideoViewer.less';

function TooltipButton(props) {
  const {
    title,
    onClick,
    children,
  } = props;

  return (
    <Tooltip
      title={title}
      color="#999"
      placement="bottomLeft"
      mouseEnterDelay={0.5}
      mouseLeaveDelay={0.1}
      trigger="hover"
    >
      <div className="cinema-button" onClick={onClick}>
        {children}
      </div>
    </Tooltip>
  );
}

export function VideoCinema(props) {
  const {
    data,
    projectId,
    onClose,
    getAPIBaseURL,
    getAttachmentVideo,
    createAttachmentVideo,
    getResourceAttachment,
    deleteAttachmentVideo,
    getAttachment,
  } = props;

  const {
    file: attachment,
  } = data;

  console.log('attachment:', attachment);

  const {
    name,
    uuid,
  } = attachment;

  const [videoInfo, setVideoInfo] = useState(null);
  const refPlayer = useRef(null);

  const getVideoInfo = async (projectId1, attachmentId) => {
    let video = null;

    try {
      video = await getAttachmentVideo(projectId1, attachmentId);
    } catch (err) {
      console.error('cannot get attachment video:', err);
      return null;
    }

    return video;
  };

  // const onChangeAttachment = async (projectId1, attachment1) => {
  //   if (!projectId1 || !attachment1) {
  //     return;
  //   }

  //   if (attachment1.source === 'resource') {
  //     try {
  //       const res = await getResourceAttachment(projectId1, attachment1.fileUrl);
  //       setVideoInfo(res);
  //     } catch (err) {
  //       console.error('cannot get resource attachment video:', err);
  //     }
  //     return;
  //   }

  //   const attachmentId = attachment1.digest;

  //   try {
  //     const res = await createAttachmentVideo(projectId1, attachmentId);
  //     console.log('createAttachmentVideo:', res);
  //   } catch (err) {
  //     console.error('cannot create attachment video:', err);
  //   }

  //   const video = await getVideoInfo(projectId1, attachmentId);
  //   console.log('video info:', video);
  //   setVideoInfo(video);
  // };

  // useEffect(() => {
  //   onChangeAttachment(projectId, attachment);
  // }, [projectId, attachment]);

  async function initPlayer() {
    // destroy the old player, if any
    // if (refPlayer.current) {
    //   refPlayer.current.destroy();
    // }

    // 资源文件
    // if (source === 'resource') {
    //   // 创建一个 URL 对象
    //   const videoURL = URL.createObjectURL(videoInfo);
    //   const videoElement = document.querySelector('.dash-video-player');
    //   // 设置视频源
    //   videoElement.src = videoURL;

    //   // 设置一些视频播放控件
    //   videoElement.controls = true;
    //   return;
    // }

    // // create a new player
    // const baseURL = getAPIBaseURL();
    // const selector = `at.${attachment.digest}`;
    // const url = `${baseURL}/projects/${projectId}/videos/${selector}/files/output.mpd`;
    // refPlayer.current = window.dashjs.MediaPlayer().create();
    // refPlayer.current.initialize(document.querySelector('.dash-video-player'), url, true);
    const src = await getAttachment(`${uuid}-${name}`);
    refPlayer.current.src = src;
  }

  function destroyPlayer() {
    if (refPlayer.current) {
      // console.log('destroy player');
      // refPlayer.current.destroy();
      // refPlayer.current = null;
    }
  }

  useEffect(()=>{
    initPlayer();
  }, [name, uuid])

  // useEffect(() => {
  //   if (!videoInfo) {
  //     return null;
  //   }

  //   if (!window.dashjs) {
  //     const script = document.createElement('script');

  //     if (import.meta.env.PROD) {
  //       script.src = '/assets/dash.all.min.27069d08.js';
  //     } else {
  //       script.src = '/dash.all.min.27069d08.js';
  //     }

  //     script.async = true;

  //     script.onload = () => {
  //       initPlayer();
  //     };

  //     document.body.appendChild(script);
  //   } else {
  //     initPlayer();
  //   }

  //   return () => {
  //     destroyPlayer();
  //     setVideoInfo(null);
  //   };
  // }, [videoInfo]);

  function onClickClose() {
    if (onClose) {
      onClose();
    }
  }

  function requestFullscreen() {
    const elem = document.querySelector('.dash-video-player');
    if (!elem) {
      return;
    }

    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    } else if (elem.mozRequestFullScreen) {
      elem.mozRequestFullScreen();
    } else if (elem.webkitRequestFullscreen) {
      elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) {
      elem.msRequestFullscreen();
    }
  }

  function onKeyDown(e) {
    if (e.key === 'Escape') {
      if (onClose) {
        onClose();
      }
    } else if (e.key === 'f') {
      if (refPlayer.current) {
        requestFullscreen();
      }
    } else if (e.key === 'm') {
      if (refPlayer.current) {
        refPlayer.current.setMute(!refPlayer.current.isMuted());
      }
    } else if (e.key === 'p' || e.key === ' ') {
      if (refPlayer.current) {
        if (refPlayer.current.isPaused()) {
          refPlayer.current.play();
        } else {
          refPlayer.current.pause();
        }
      }
    }
  }

  useEffect(() => {
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  function renderVideo() {

    // if (videoInfo.state === 0) {
    //   return (
    //     <div>
    //       视频尚未处理
    //     </div>
    //   );
    // }

    // if (videoInfo.state === 1) {
    //   return (
    //     <div>
    //       视频正在处理中，请稍后重试...
    //     </div>
    //   );
    // }

    // if (videoInfo.state === 3) {
    //   return (
    //     <div>
    //       视频处理失败
    //     </div>
    //   );
    // }

    // if (videoInfo.state !== 2 && source !== 'resource') {
    //   return (
    //     <div>
    //       视频状态异常（状态码:
    //       {' '}
    //       {videoInfo.state}
    //       ）
    //     </div>
    //   );
    // }

    return (
      <div className="video-box">
        <video ref={refPlayer} className="dash-video-player" controls />
      </div>
    );
  }

  return (
    <div className="video-cinema">
      <div className="video-container">
              {renderVideo()}
            </div>
            <div className="video-title">
              <span>{attachment.name || '无标题'}</span>
            </div>

      <div className="cinema-toolbar">
        <TooltipButton
          title="退出视频模式。快捷键: Esc"
          onClick={onClickClose}
        >
          <CloseOutlined />
        </TooltipButton>
      </div>
    </div>
  );
}

function onCloseCinema(elem, root) {
  root.unmount();
  elem.remove();
}

export function showCinema(props) {
  const {
    data,
    projectId,
    getAPIBaseURL,
    getAttachmentVideo,
    createAttachmentVideo,
    deleteAttachmentVideo,
    getResourceAttachment,
    getAttachment,
  } = props;

  const elem = document.createElement('div');
  const className = 'video-cinema-container';
  elem.classList.add(className);

  const body = document.querySelector('body');
  body.appendChild(elem);

  const root = ReactDOM.createRoot(elem);
  root.render(
    <VideoCinema
      data={data}
      projectId={projectId}
      onClose={(e) => onCloseCinema(elem, root)}
      getAPIBaseURL={getAPIBaseURL}
      getAttachmentVideo={getAttachmentVideo}
      createAttachmentVideo={createAttachmentVideo}
      deleteAttachmentVideo={deleteAttachmentVideo}
      getResourceAttachment={getResourceAttachment}
      getAttachment={getAttachment}
    />
  )
}
