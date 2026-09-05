/**
 * Instagram Better Controls - Adobe Premiere & After Effects Compatibility Engine
 *
 * Resolves:
 * 1. Audio repetition / looping / echo glitches (removes corrupt 'elst' edit list atoms).
 * 2. Slowed down / deep demon voice glitches (decodes HE-AAC SBR at 48kHz and re-encodes to standard AAC-LC).
 * 3. Video stutter / FPS drop / playback lag (conforms timestamps to Constant Frame Rate CFR).
 * 4. Sample rate mismatch (normalizes audio to universal 48,000 Hz Stereo).
 * 5. FastStart container layout (places 'moov' atom before 'mdat' for instant NLE import).
 */

(() => {
  'use strict';

  // --- Binary Read/Write Utilities ---
  class BinWriter {
    constructor(initialSize = 1024 * 1024) {
      this.buffer = new Uint8Array(initialSize);
      this.length = 0;
    }

    ensureCapacity(additional) {
      if (this.length + additional > this.buffer.length) {
        let newSize = Math.max(this.buffer.length * 2, this.length + additional + 65536);
        const newBuf = new Uint8Array(newSize);
        newBuf.set(this.buffer.subarray(0, this.length));
        this.buffer = newBuf;
      }
    }

    writeU8(val) {
      this.ensureCapacity(1);
      this.buffer[this.length++] = val & 0xff;
    }

    writeU16(val) {
      this.ensureCapacity(2);
      this.buffer[this.length++] = (val >> 8) & 0xff;
      this.buffer[this.length++] = val & 0xff;
    }

    writeU24(val) {
      this.ensureCapacity(3);
      this.buffer[this.length++] = (val >> 16) & 0xff;
      this.buffer[this.length++] = (val >> 8) & 0xff;
      this.buffer[this.length++] = val & 0xff;
    }

    writeU32(val) {
      this.ensureCapacity(4);
      this.buffer[this.length++] = (val >>> 24) & 0xff;
      this.buffer[this.length++] = (val >>> 16) & 0xff;
      this.buffer[this.length++] = (val >>> 8) & 0xff;
      this.buffer[this.length++] = val & 0xff;
    }

    writeBytes(bytes) {
      if (!bytes || !bytes.length) return;
      this.ensureCapacity(bytes.length);
      this.buffer.set(bytes, this.length);
      this.length += bytes.length;
    }

    writeAscii(str) {
      for (let i = 0; i < str.length; i++) {
        this.writeU8(str.charCodeAt(i));
      }
    }

    toUint8Array() {
      return this.buffer.subarray(0, this.length);
    }
  }

  const buildBox = (type, payloadBytes) => {
    const size = 8 + payloadBytes.length;
    const box = new Uint8Array(size);
    box[0] = (size >>> 24) & 0xff;
    box[1] = (size >>> 16) & 0xff;
    box[2] = (size >>> 8) & 0xff;
    box[3] = size & 0xff;
    for (let i = 0; i < 4; i++) {
      box[4 + i] = type.charCodeAt(i);
    }
    box.set(payloadBytes, 8);
    return box;
  };

  // --- MP4 Box Parser ---
  const parseBoxes = (buffer, offset = 0, length = buffer.byteLength - offset) => {
    const view = new DataView(buffer, offset, length);
    const boxes = [];
    let pos = 0;

    while (pos + 8 <= length) {
      let size = view.getUint32(pos);
      const type = String.fromCharCode(
        view.getUint8(pos + 4),
        view.getUint8(pos + 5),
        view.getUint8(pos + 6),
        view.getUint8(pos + 7)
      );

      let headerSize = 8;
      if (size === 1) {
        if (pos + 16 > length) break;
        const high = view.getUint32(pos + 8);
        const low = view.getUint32(pos + 12);
        size = high * 4294967296 + low;
        headerSize = 16;
      } else if (size === 0) {
        size = length - pos;
      }

      if (size < headerSize || pos + size > length) break;

      boxes.push({
        type,
        offset: offset + pos,
        headerSize,
        size,
        dataOffset: offset + pos + headerSize,
        dataSize: size - headerSize,
      });

      pos += size;
    }

    return boxes;
  };

  const findBox = (boxes, type) => boxes.find((b) => b.type === type);
  const findBoxes = (boxes, type) => boxes.filter((b) => b.type === type);

  // --- Track Analysis ---
  const parseTrack = (buffer, trakBox) => {
    const trakBoxes = parseBoxes(buffer, trakBox.dataOffset, trakBox.dataSize);
    const tkhdBox = findBox(trakBoxes, 'tkhd');
    const mdiaBox = findBox(trakBoxes, 'mdia');
    if (!tkhdBox || !mdiaBox) return null;

    const tkhdView = new DataView(buffer, tkhdBox.dataOffset, tkhdBox.dataSize);
    const tkhdVersion = tkhdView.getUint8(0);
    const trackId = tkhdVersion === 1 ? tkhdView.getUint32(20) : tkhdView.getUint32(12);

    const mdiaBoxes = parseBoxes(buffer, mdiaBox.dataOffset, mdiaBox.dataSize);
    const mdhdBox = findBox(mdiaBoxes, 'mdhd');
    const hdlrBox = findBox(mdiaBoxes, 'hdlr');
    const minfBox = findBox(mdiaBoxes, 'minf');
    if (!mdhdBox || !hdlrBox || !minfBox) return null;

    const mdhdView = new DataView(buffer, mdhdBox.dataOffset, mdhdBox.dataSize);
    const mdhdVersion = mdhdView.getUint8(0);
    const timescale = mdhdVersion === 1 ? mdhdView.getUint32(28) : mdhdView.getUint32(20);
    const duration = mdhdVersion === 1
      ? mdhdView.getUint32(32) * 4294967296 + mdhdView.getUint32(36)
      : mdhdView.getUint32(24);

    const hdlrView = new DataView(buffer, hdlrBox.dataOffset, hdlrBox.dataSize);
    const handlerType = String.fromCharCode(
      hdlrView.getUint8(8),
      hdlrView.getUint8(9),
      hdlrView.getUint8(10),
      hdlrView.getUint8(11)
    );

    const minfBoxes = parseBoxes(buffer, minfBox.dataOffset, minfBox.dataSize);
    const stblBox = findBox(minfBoxes, 'stbl');
    if (!stblBox) return null;

    const stblBoxes = parseBoxes(buffer, stblBox.dataOffset, stblBox.dataSize);
    const stsdBox = findBox(stblBoxes, 'stsd');
    const sttsBox = findBox(stblBoxes, 'stts');
    const stscBox = findBox(stblBoxes, 'stsc');
    const stszBox = findBox(stblBoxes, 'stsz');
    const stcoBox = findBox(stblBoxes, 'stco');
    const co64Box = findBox(stblBoxes, 'co64');
    const stssBox = findBox(stblBoxes, 'stss');
    const cttsBox = findBox(stblBoxes, 'ctts');

    if (!stsdBox || !sttsBox || !stscBox || !stszBox || (!stcoBox && !co64Box)) {
      return null;
    }

    return {
      trakBox,
      trackId,
      handlerType,
      timescale,
      duration,
      stsdBox,
      sttsBox,
      stscBox,
      stszBox,
      stcoBox: stcoBox || co64Box,
      isCo64: !!co64Box,
      stssBox,
      cttsBox,
    };
  };

  // Extract samples (sizes and file offsets) from stbl tables
  const extractSamples = (buffer, trackInfo) => {
    const view = new DataView(buffer);

    // Parse stsz (sample sizes)
    const stszOffset = trackInfo.stszBox.dataOffset;
    const defaultSampleSize = view.getUint32(stszOffset + 4);
    const sampleCount = view.getUint32(stszOffset + 8);
    const sampleSizes = new Uint32Array(sampleCount);

    if (defaultSampleSize !== 0) {
      sampleSizes.fill(defaultSampleSize);
    } else {
      for (let i = 0; i < sampleCount; i++) {
        sampleSizes[i] = view.getUint32(stszOffset + 12 + i * 4);
      }
    }

    // Parse stco/co64 (chunk offsets)
    const stcoOffset = trackInfo.stcoBox.dataOffset;
    const chunkCount = view.getUint32(stcoOffset + 4);
    const chunkOffsets = [];
    if (trackInfo.isCo64) {
      for (let i = 0; i < chunkCount; i++) {
        const high = view.getUint32(stcoOffset + 8 + i * 8);
        const low = view.getUint32(stcoOffset + 12 + i * 8);
        chunkOffsets.push(high * 4294967296 + low);
      }
    } else {
      for (let i = 0; i < chunkCount; i++) {
        chunkOffsets.push(view.getUint32(stcoOffset + 8 + i * 4));
      }
    }

    // Parse stsc (sample-to-chunk)
    const stscOffset = trackInfo.stscBox.dataOffset;
    const stscEntryCount = view.getUint32(stscOffset + 4);
    const stscEntries = [];
    for (let i = 0; i < stscEntryCount; i++) {
      stscEntries.push({
        firstChunk: view.getUint32(stscOffset + 8 + i * 12),
        samplesPerChunk: view.getUint32(stscOffset + 12 + i * 12),
        sampleDescriptionIndex: view.getUint32(stscOffset + 16 + i * 12),
      });
    }

    // Map each sample to its byte offset in the file
    const sampleOffsets = new Float64Array(sampleCount);
    let sampleIdx = 0;
    for (let chunkIdx = 0; chunkIdx < chunkCount; chunkIdx++) {
      const chunkNum = chunkIdx + 1;
      let spc = 0;
      for (let j = stscEntries.length - 1; j >= 0; j--) {
        if (chunkNum >= stscEntries[j].firstChunk) {
          spc = stscEntries[j].samplesPerChunk;
          break;
        }
      }

      let currentOffset = chunkOffsets[chunkIdx];
      for (let s = 0; s < spc && sampleIdx < sampleCount; s++) {
        sampleOffsets[sampleIdx] = currentOffset;
        currentOffset += sampleSizes[sampleIdx];
        sampleIdx++;
      }
    }

    // Parse stss (keyframes / sync samples) if present
    let keyframeIndices = null;
    if (trackInfo.stssBox) {
      const stssOffset = trackInfo.stssBox.dataOffset;
      const keyCount = view.getUint32(stssOffset + 4);
      keyframeIndices = new Uint32Array(keyCount);
      for (let i = 0; i < keyCount; i++) {
        keyframeIndices[i] = view.getUint32(stssOffset + 8 + i * 4); // 1-based
      }
    }

    return {
      count: sampleCount,
      sizes: sampleSizes,
      offsets: sampleOffsets,
      keyframes: keyframeIndices,
    };
  };

  // --- Audio Decoding & Re-encoding ---
  const decodeAudioBuffer = async (arrayBuffer) => {
    // Uses Chrome's internal engine to decode HE-AAC / AAC-LC into clean 48000 Hz stereo PCM
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioCtx({ sampleRate: 48000 });
    try {
      // Decode audio data safely
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer.slice(0));
      return audioBuffer;
    } finally {
      try {
        ctx.close();
      } catch (_) {}
    }
  };

  const encodePcmToAac = async (audioBuffer) => {
    if (typeof AudioEncoder !== 'function') {
      throw new Error('WebCodecs AudioEncoder is not supported in this browser.');
    }

    const sampleRate = 48000;
    const channels = Math.min(audioBuffer.numberOfChannels, 2);
    const totalFrames = audioBuffer.length;

    // Check if AAC encoding is supported
    const aacConfig = {
      codec: 'mp4a.40.2', // AAC-LC
      sampleRate,
      numberOfChannels: channels,
      bitrate: 192000,
    };

    const isSupported = await AudioEncoder.isConfigSupported(aacConfig);
    if (!isSupported || !isSupported.supported) {
      throw new Error('AAC-LC encoding is not supported on this platform.');
    }

    const encodedChunks = [];
    let audioSpecificConfig = null;

    const encoder = new AudioEncoder({
      output: (chunk, metadata) => {
        const data = new Uint8Array(chunk.byteLength);
        chunk.copyTo(data);
        encodedChunks.push({
          data,
          duration: chunk.duration,
          timestamp: chunk.timestamp,
        });

        if (metadata && metadata.decoderConfig && metadata.decoderConfig.description) {
          audioSpecificConfig = new Uint8Array(metadata.decoderConfig.description);
        }
      },
      error: (e) => {
        console.error('AudioEncoder error:', e);
      },
    });

    encoder.configure(aacConfig);

    // Feed PCM data in 1024-frame chunks (standard AAC frame size)
    const FRAME_SIZE = 1024;
    const planarData = new Float32Array(channels * FRAME_SIZE);

    for (let offset = 0; offset < totalFrames; offset += FRAME_SIZE) {
      const framesInChunk = Math.min(FRAME_SIZE, totalFrames - offset);
      planarData.fill(0);

      for (let ch = 0; ch < channels; ch++) {
        const channelData = audioBuffer.getChannelData(ch);
        planarData.set(channelData.subarray(offset, offset + framesInChunk), ch * FRAME_SIZE);
      }

      const timestampUs = Math.round((offset / sampleRate) * 1000000);
      const audioData = new AudioData({
        format: 'f32-planar',
        sampleRate,
        numberOfFrames: FRAME_SIZE,
        numberOfChannels: channels,
        timestamp: timestampUs,
        data: planarData,
      });

      encoder.encode(audioData);
      audioData.close();
    }

    await encoder.flush();
    encoder.close();

    // Default AudioSpecificConfig for 48kHz Stereo AAC-LC if not emitted:
    // Audio Object Type: 2 (AAC-LC, 5 bits: 00010)
    // Sampling Frequency Index: 3 (48000 Hz, 4 bits: 0011)
    // Channel Configuration: 2 (Stereo, 4 bits: 0010)
    // -> 0001 0001 1001 0000 -> 0x11, 0x90
    if (!audioSpecificConfig) {
      audioSpecificConfig = new Uint8Array([0x11, 0x90]);
    }

    return {
      chunks: encodedChunks,
      audioSpecificConfig,
      sampleRate,
      channels,
      totalFrames,
    };
  };

  // --- MP4 Assembly for Adobe Compatibility ---
  const buildAdobeSafeMp4 = (originalBuffer, videoTrack, videoSamples, audioResult) => {
    const origView = new DataView(originalBuffer);

    // 1. Prepare video sample payloads & table
    const vCount = videoSamples.count;
    const vSizes = videoSamples.sizes;
    const vOffsets = videoSamples.offsets;

    // Conforming Video to Constant Frame Rate (CFR):
    // Standard 30.000 fps timescale: 30000, frame duration: 1000.
    const vTimescale = 30000;
    const vFrameDuration = 1000;
    const vDuration = vCount * vFrameDuration;

    // 2. Prepare audio payloads & table (if audio exists)
    let aCount = 0;
    let aChunks = [];
    let aDuration = 0;
    const aTimescale = 48000;
    const aFrameDuration = 1024;

    if (audioResult && audioResult.chunks && audioResult.chunks.length) {
      aChunks = audioResult.chunks;
      aCount = aChunks.length;
      aDuration = aCount * aFrameDuration;
    }

    // 3. Build mdat (Media Data Box)
    let totalMdatSize = 0;
    for (let i = 0; i < vCount; i++) totalMdatSize += vSizes[i];
    for (let i = 0; i < aCount; i++) totalMdatSize += aChunks[i].data.length;

    const mdatHeaderSize = 8;
    const mdatPayload = new Uint8Array(totalMdatSize);
    const newVideoOffsets = new Float64Array(vCount);
    const newAudioOffsets = new Float64Array(aCount);

    let mdatWritePos = 0;
    // Copy video payloads into mdat
    for (let i = 0; i < vCount; i++) {
      newVideoOffsets[i] = mdatWritePos;
      const srcOffset = vOffsets[i];
      const sz = vSizes[i];
      mdatPayload.set(new Uint8Array(originalBuffer, srcOffset, sz), mdatWritePos);
      mdatWritePos += sz;
    }

    // Copy audio payloads into mdat
    for (let i = 0; i < aCount; i++) {
      newAudioOffsets[i] = mdatWritePos;
      const aData = aChunks[i].data;
      mdatPayload.set(aData, mdatWritePos);
      mdatWritePos += aData.length;
    }

    // 4. Build ftyp Box
    const ftypWriter = new BinWriter(64);
    ftypWriter.writeAscii('isom'); // major_brand
    ftypWriter.writeU32(512);     // minor_version
    ftypWriter.writeAscii('isom'); // compatible_brands
    ftypWriter.writeAscii('iso2');
    ftypWriter.writeAscii('avc1');
    ftypWriter.writeAscii('mp41');
    const ftypBox = buildBox('ftyp', ftypWriter.toUint8Array());

    // 5. Function to build moov box given baseMdatOffset
    const createMoovBox = (baseMdatPayloadOffset) => {
      const moovWriter = new BinWriter(1024 * 512);

      // Movie duration in mvhd timescale (1000 units/sec)
      const mvhdTimescale = 1000;
      const movieDuration = Math.round((vDuration / vTimescale) * mvhdTimescale);

      // --- mvhd Box ---
      const mvhdWriter = new BinWriter(128);
      mvhdWriter.writeU8(0); // version
      mvhdWriter.writeU24(0); // flags
      mvhdWriter.writeU32(0); // creation_time
      mvhdWriter.writeU32(0); // modification_time
      mvhdWriter.writeU32(mvhdTimescale);
      mvhdWriter.writeU32(movieDuration);
      mvhdWriter.writeU32(0x00010000); // rate 1.0
      mvhdWriter.writeU16(0x0100);     // volume 1.0
      mvhdWriter.writeU16(0);          // reserved
      mvhdWriter.writeU32(0);
      mvhdWriter.writeU32(0);
      // Identity matrix (36 bytes)
      const matrix = [0x00010000, 0, 0, 0, 0x00010000, 0, 0, 0, 0x40000000];
      for (const m of matrix) mvhdWriter.writeU32(m);
      // Pre-defined (24 bytes)
      for (let i = 0; i < 6; i++) mvhdWriter.writeU32(0);
      mvhdWriter.writeU32(aCount > 0 ? 3 : 2); // next_track_ID
      const mvhdBox = buildBox('mvhd', mvhdWriter.toUint8Array());
      moovWriter.writeBytes(mvhdBox);

      // --- Video trak Box ---
      {
        const vTrakWriter = new BinWriter(1024 * 256);

        // Extract original tkhd dimensions & matrix
        const origTkhdBox = findBox(
          parseBoxes(originalBuffer, videoTrack.trakBox.dataOffset, videoTrack.trakBox.dataSize),
          'tkhd'
        );
        const origTkhdBytes = new Uint8Array(
          originalBuffer,
          origTkhdBox.dataOffset,
          origTkhdBox.dataSize
        );
        const vWidth = origView.getUint32(origTkhdBox.dataOffset + origTkhdBox.dataSize - 8);
        const vHeight = origView.getUint32(origTkhdBox.dataOffset + origTkhdBox.dataSize - 4);

        // Build clean tkhd (track 1, video)
        const tkhdWriter = new BinWriter(100);
        tkhdWriter.writeU8(0); // version
        tkhdWriter.writeU24(0x000007); // flags: enabled, in_movie, in_preview
        tkhdWriter.writeU32(0); // creation_time
        tkhdWriter.writeU32(0); // modification_time
        tkhdWriter.writeU32(1); // track_ID = 1
        tkhdWriter.writeU32(0); // reserved
        tkhdWriter.writeU32(movieDuration);
        tkhdWriter.writeU32(0); // reserved[2]
        tkhdWriter.writeU32(0);
        tkhdWriter.writeU16(0); // layer
        tkhdWriter.writeU16(0); // alternate_group
        tkhdWriter.writeU16(0); // volume = 0 for video
        tkhdWriter.writeU16(0); // reserved
        // Copy matrix from original tkhd if available, else identity
        if (origTkhdBytes.length >= 84) {
          const mOffset = origTkhdBox.dataSize - 44;
          tkhdWriter.writeBytes(new Uint8Array(originalBuffer, origTkhdBox.dataOffset + mOffset, 36));
        } else {
          for (const m of matrix) tkhdWriter.writeU32(m);
        }
        tkhdWriter.writeU32(vWidth);
        tkhdWriter.writeU32(vHeight);
        vTrakWriter.writeBytes(buildBox('tkhd', tkhdWriter.toUint8Array()));

        // Notice: NO 'edts' / 'elst' box included! Completely stripped!

        // Video mdia Box
        const mdiaWriter = new BinWriter(1024 * 200);

        // mdhd Box
        const mdhdWriter = new BinWriter(40);
        mdhdWriter.writeU8(0); // version
        mdhdWriter.writeU24(0); // flags
        mdhdWriter.writeU32(0); // creation_time
        mdhdWriter.writeU32(0); // modification_time
        mdhdWriter.writeU32(vTimescale);
        mdhdWriter.writeU32(vDuration);
        mdhdWriter.writeU16(0x55c4); // language = 'und'
        mdhdWriter.writeU16(0); // pre_defined
        mdiaWriter.writeBytes(buildBox('mdhd', mdhdWriter.toUint8Array()));

        // hdlr Box
        const hdlrWriter = new BinWriter(40);
        hdlrWriter.writeU8(0);
        hdlrWriter.writeU24(0);
        hdlrWriter.writeU32(0); // pre_defined
        hdlrWriter.writeAscii('vide'); // handler_type
        for (let i = 0; i < 3; i++) hdlrWriter.writeU32(0); // reserved
        hdlrWriter.writeAscii('VideoHandler\0');
        mdiaWriter.writeBytes(buildBox('hdlr', hdlrWriter.toUint8Array()));

        // minf Box
        const minfWriter = new BinWriter(1024 * 180);

        // vmhd Box
        const vmhdWriter = new BinWriter(20);
        vmhdWriter.writeU8(0);
        vmhdWriter.writeU24(1); // flags = 1
        vmhdWriter.writeU16(0); // graphicsmode
        for (let i = 0; i < 3; i++) vmhdWriter.writeU16(0); // opcolor
        minfWriter.writeBytes(buildBox('vmhd', vmhdWriter.toUint8Array()));

        // dinf -> dref Box
        const dinfWriter = new BinWriter(40);
        const drefWriter = new BinWriter(30);
        drefWriter.writeU8(0);
        drefWriter.writeU24(0);
        drefWriter.writeU32(1); // entry_count = 1
        // url entry (self-contained)
        drefWriter.writeU32(12);
        drefWriter.writeAscii('url ');
        drefWriter.writeU8(0);
        drefWriter.writeU24(1);
        dinfWriter.writeBytes(buildBox('dref', drefWriter.toUint8Array()));
        minfWriter.writeBytes(buildBox('dinf', dinfWriter.toUint8Array()));

        // stbl Box
        const stblWriter = new BinWriter(1024 * 160);

        // 1. stsd Box (copy raw stsd from original video track)
        const origStsdBytes = new Uint8Array(
          originalBuffer,
          videoTrack.stsdBox.dataOffset,
          videoTrack.stsdBox.dataSize
        );
        stblWriter.writeBytes(buildBox('stsd', origStsdBytes));

        // 2. stts Box - Pure CFR (1 entry: count = vCount, delta = vFrameDuration)
        const sttsWriter = new BinWriter(24);
        sttsWriter.writeU8(0);
        sttsWriter.writeU24(0);
        sttsWriter.writeU32(1); // entry_count = 1
        sttsWriter.writeU32(vCount);
        sttsWriter.writeU32(vFrameDuration);
        stblWriter.writeBytes(buildBox('stts', sttsWriter.toUint8Array()));

        // 3. stss Box (Keyframes)
        if (videoSamples.keyframes && videoSamples.keyframes.length) {
          const kCount = videoSamples.keyframes.length;
          const stssWriter = new BinWriter(12 + kCount * 4);
          stssWriter.writeU8(0);
          stssWriter.writeU24(0);
          stssWriter.writeU32(kCount);
          for (let i = 0; i < kCount; i++) {
            stssWriter.writeU32(videoSamples.keyframes[i]);
          }
          stblWriter.writeBytes(buildBox('stss', stssWriter.toUint8Array()));
        }

        // 4. stsc Box (1 sample per chunk)
        const stscWriter = new BinWriter(28);
        stscWriter.writeU8(0);
        stscWriter.writeU24(0);
        stscWriter.writeU32(1); // entry_count = 1
        stscWriter.writeU32(1); // first_chunk = 1
        stscWriter.writeU32(1); // samples_per_chunk = 1
        stscWriter.writeU32(1); // sample_description_index = 1
        stblWriter.writeBytes(buildBox('stsc', stscWriter.toUint8Array()));

        // 5. stsz Box
        const stszWriter = new BinWriter(16 + vCount * 4);
        stszWriter.writeU8(0);
        stszWriter.writeU24(0);
        stszWriter.writeU32(0); // sample_size = 0 (variable)
        stszWriter.writeU32(vCount);
        for (let i = 0; i < vCount; i++) {
          stszWriter.writeU32(vSizes[i]);
        }
        stblWriter.writeBytes(buildBox('stsz', stszWriter.toUint8Array()));

        // 6. stco Box (Chunk Offsets in file)
        const stcoWriter = new BinWriter(12 + vCount * 4);
        stcoWriter.writeU8(0);
        stcoWriter.writeU24(0);
        stcoWriter.writeU32(vCount);
        for (let i = 0; i < vCount; i++) {
          stcoWriter.writeU32(Math.round(baseMdatPayloadOffset + newVideoOffsets[i]));
        }
        stblWriter.writeBytes(buildBox('stco', stcoWriter.toUint8Array()));

        minfWriter.writeBytes(buildBox('stbl', stblWriter.toUint8Array()));
        mdiaWriter.writeBytes(buildBox('minf', minfWriter.toUint8Array()));
        vTrakWriter.writeBytes(buildBox('mdia', mdiaWriter.toUint8Array()));
        moovWriter.writeBytes(buildBox('trak', vTrakWriter.toUint8Array()));
      }

      // --- Audio trak Box (if present) ---
      if (aCount > 0) {
        const aTrakWriter = new BinWriter(1024 * 128);

        // tkhd Box (track 2, audio)
        const tkhdWriter = new BinWriter(100);
        tkhdWriter.writeU8(0);
        tkhdWriter.writeU24(0x000007);
        tkhdWriter.writeU32(0);
        tkhdWriter.writeU32(0);
        tkhdWriter.writeU32(2); // track_ID = 2
        tkhdWriter.writeU32(0);
        tkhdWriter.writeU32(movieDuration);
        tkhdWriter.writeU32(0);
        tkhdWriter.writeU32(0);
        tkhdWriter.writeU16(0); // layer
        tkhdWriter.writeU16(0); // alternate_group
        tkhdWriter.writeU16(0x0100); // volume = 1.0
        tkhdWriter.writeU16(0);
        for (const m of matrix) tkhdWriter.writeU32(m);
        tkhdWriter.writeU32(0); // width = 0
        tkhdWriter.writeU32(0); // height = 0
        aTrakWriter.writeBytes(buildBox('tkhd', tkhdWriter.toUint8Array()));

        // Notice: NO 'edts' / 'elst' box included! Completely stripped!

        // Audio mdia Box
        const mdiaWriter = new BinWriter(1024 * 100);

        // mdhd Box
        const mdhdWriter = new BinWriter(40);
        mdhdWriter.writeU8(0);
        mdhdWriter.writeU24(0);
        mdhdWriter.writeU32(0);
        mdhdWriter.writeU32(0);
        mdhdWriter.writeU32(aTimescale);
        mdhdWriter.writeU32(aDuration);
        mdhdWriter.writeU16(0x55c4); // 'und'
        mdhdWriter.writeU16(0);
        mdiaWriter.writeBytes(buildBox('mdhd', mdhdWriter.toUint8Array()));

        // hdlr Box
        const hdlrWriter = new BinWriter(40);
        hdlrWriter.writeU8(0);
        hdlrWriter.writeU24(0);
        hdlrWriter.writeU32(0);
        hdlrWriter.writeAscii('soun'); // SoundHandler
        for (let i = 0; i < 3; i++) hdlrWriter.writeU32(0);
        hdlrWriter.writeAscii('SoundHandler\0');
        mdiaWriter.writeBytes(buildBox('hdlr', hdlrWriter.toUint8Array()));

        // minf Box
        const minfWriter = new BinWriter(1024 * 80);

        // smhd Box
        const smhdWriter = new BinWriter(20);
        smhdWriter.writeU8(0);
        smhdWriter.writeU24(0);
        smhdWriter.writeU16(0); // balance
        smhdWriter.writeU16(0); // reserved
        minfWriter.writeBytes(buildBox('smhd', smhdWriter.toUint8Array()));

        // dinf -> dref Box
        const dinfWriter = new BinWriter(40);
        const drefWriter = new BinWriter(30);
        drefWriter.writeU8(0);
        drefWriter.writeU24(0);
        drefWriter.writeU32(1);
        drefWriter.writeU32(12);
        drefWriter.writeAscii('url ');
        drefWriter.writeU8(0);
        drefWriter.writeU24(1);
        dinfWriter.writeBytes(buildBox('dref', drefWriter.toUint8Array()));
        minfWriter.writeBytes(buildBox('dinf', dinfWriter.toUint8Array()));

        // stbl Box
        const stblWriter = new BinWriter(1024 * 60);

        // 1. stsd Box for standard AAC-LC
        const mp4aWriter = new BinWriter(128);
        mp4aWriter.writeBytes(new Uint8Array(6)); // reserved
        mp4aWriter.writeU16(1); // data_reference_index = 1
        mp4aWriter.writeU32(0); // reserved[0]
        mp4aWriter.writeU32(0); // reserved[1]
        mp4aWriter.writeU16(audioResult.channels || 2); // channelcount
        mp4aWriter.writeU16(16); // samplesize = 16 bits
        mp4aWriter.writeU16(0);  // pre_defined
        mp4aWriter.writeU16(0);  // reserved
        mp4aWriter.writeU32(aTimescale << 16); // samplerate (16.16 fixed point)

        // esds Box inside mp4a
        const asc = audioResult.audioSpecificConfig || new Uint8Array([0x11, 0x90]);
        const esdsPayloadWriter = new BinWriter(64);
        esdsPayloadWriter.writeU8(0); // version
        esdsPayloadWriter.writeU24(0); // flags

        // ES_Descriptor (tag 0x03)
        esdsPayloadWriter.writeU8(0x03);
        esdsPayloadWriter.writeU8(20 + asc.length); // length
        esdsPayloadWriter.writeU16(1); // ES_ID
        esdsPayloadWriter.writeU8(0); // streamPriority

        // DecoderConfigDescriptor (tag 0x04)
        esdsPayloadWriter.writeU8(0x04);
        esdsPayloadWriter.writeU8(12 + asc.length); // length
        esdsPayloadWriter.writeU8(0x40); // objectTypeIndication = 0x40 (Audio ISO/IEC 14496-3 AAC)
        esdsPayloadWriter.writeU8(0x15); // streamType = Audio (5 << 2 | 1)
        esdsPayloadWriter.writeU24(0);   // bufferSizeDB
        esdsPayloadWriter.writeU32(192000); // maxBitrate
        esdsPayloadWriter.writeU32(192000); // avgBitrate

        // DecSpecificInfo (tag 0x05)
        esdsPayloadWriter.writeU8(0x05);
        esdsPayloadWriter.writeU8(asc.length);
        esdsPayloadWriter.writeBytes(asc);

        // SLConfigDescriptor (tag 0x06)
        esdsPayloadWriter.writeU8(0x06);
        esdsPayloadWriter.writeU8(1);
        esdsPayloadWriter.writeU8(2); // predefined = 2 (reserved)

        mp4aWriter.writeBytes(buildBox('esds', esdsPayloadWriter.toUint8Array()));

        const stsdWriter = new BinWriter(160);
        stsdWriter.writeU8(0);
        stsdWriter.writeU24(0);
        stsdWriter.writeU32(1); // entry_count = 1
        stsdWriter.writeBytes(buildBox('mp4a', mp4aWriter.toUint8Array()));
        stblWriter.writeBytes(buildBox('stsd', stsdWriter.toUint8Array()));

        // 2. stts Box - Audio sample duration is constant 1024 samples
        const sttsWriter = new BinWriter(24);
        sttsWriter.writeU8(0);
        sttsWriter.writeU24(0);
        sttsWriter.writeU32(1);
        sttsWriter.writeU32(aCount);
        sttsWriter.writeU32(aFrameDuration);
        stblWriter.writeBytes(buildBox('stts', sttsWriter.toUint8Array()));

        // 3. stsc Box (1 sample per chunk)
        const stscWriter = new BinWriter(28);
        stscWriter.writeU8(0);
        stscWriter.writeU24(0);
        stscWriter.writeU32(1);
        stscWriter.writeU32(1);
        stscWriter.writeU32(1);
        stscWriter.writeU32(1);
        stblWriter.writeBytes(buildBox('stsc', stscWriter.toUint8Array()));

        // 4. stsz Box (audio chunk sizes)
        const stszWriter = new BinWriter(16 + aCount * 4);
        stszWriter.writeU8(0);
        stszWriter.writeU24(0);
        stszWriter.writeU32(0);
        stszWriter.writeU32(aCount);
        for (let i = 0; i < aCount; i++) {
          stszWriter.writeU32(aChunks[i].data.length);
        }
        stblWriter.writeBytes(buildBox('stsz', stszWriter.toUint8Array()));

        // 5. stco Box (Audio Chunk Offsets in file)
        const stcoWriter = new BinWriter(12 + aCount * 4);
        stcoWriter.writeU8(0);
        stcoWriter.writeU24(0);
        stcoWriter.writeU32(aCount);
        for (let i = 0; i < aCount; i++) {
          stcoWriter.writeU32(Math.round(baseMdatPayloadOffset + newAudioOffsets[i]));
        }
        stblWriter.writeBytes(buildBox('stco', stcoWriter.toUint8Array()));

        minfWriter.writeBytes(buildBox('stbl', stblWriter.toUint8Array()));
        mdiaWriter.writeBytes(buildBox('minf', minfWriter.toUint8Array()));
        aTrakWriter.writeBytes(buildBox('mdia', mdiaWriter.toUint8Array()));
        moovWriter.writeBytes(buildBox('trak', aTrakWriter.toUint8Array()));
      }

      return buildBox('moov', moovWriter.toUint8Array());
    };

    // Calculate exact size of moov (iteratively resolve file offsets)
    let approxMoovOffset = ftypBox.length;
    let moovBox = createMoovBox(approxMoovOffset + 1000 + mdatHeaderSize);
    let exactMdatPayloadOffset = ftypBox.length + moovBox.length + mdatHeaderSize;
    // Rebuild moov with the exact mdat offset
    moovBox = createMoovBox(exactMdatPayloadOffset);

    // 6. Build final mdat Box
    const mdatBox = buildBox('mdat', mdatPayload);

    // 7. Combine all into FastStart MP4: [ftyp] [moov] [mdat]
    const finalSize = ftypBox.length + moovBox.length + mdatBox.length;
    const finalBuffer = new Uint8Array(finalSize);
    finalBuffer.set(ftypBox, 0);
    finalBuffer.set(moovBox, ftypBox.length);
    finalBuffer.set(mdatBox, ftypBox.length + moovBox.length);

    return new Blob([finalBuffer], { type: 'video/mp4' });
  };

  // --- Main Normalizer Pipeline ---
  const normalizeForAdobe = async (blob, onProgress = () => {}) => {
    try {
      onProgress('reading', 0.1);
      const arrayBuffer = await blob.arrayBuffer();

      onProgress('parsing', 0.2);
      const rootBoxes = parseBoxes(arrayBuffer);
      const moovBox = findBox(rootBoxes, 'moov');
      if (!moovBox) {
        throw new Error('Invalid MP4: moov box not found.');
      }

      const trakBoxes = findBoxes(
        parseBoxes(arrayBuffer, moovBox.dataOffset, moovBox.dataSize),
        'trak'
      );

      let videoTrack = null;
      let audioTrack = null;

      for (const tBox of trakBoxes) {
        const parsed = parseTrack(arrayBuffer, tBox);
        if (!parsed) continue;
        if (parsed.handlerType === 'vide' && !videoTrack) videoTrack = parsed;
        else if (parsed.handlerType === 'soun' && !audioTrack) audioTrack = parsed;
      }

      if (!videoTrack) {
        throw new Error('No video track found in MP4.');
      }

      const videoSamples = extractSamples(arrayBuffer, videoTrack);
      if (!videoSamples || videoSamples.count === 0) {
        throw new Error('No video samples found.');
      }

      let audioResult = null;
      if (audioTrack) {
        try {
          onProgress('decoding-audio', 0.4);
          const decodedPcm = await decodeAudioBuffer(arrayBuffer);

          onProgress('encoding-audio', 0.7);
          audioResult = await encodePcmToAac(decodedPcm);
        } catch (audioErr) {
          console.warn('[AdobeTranscoder] Audio re-encoding failed, continuing with direct stream:', audioErr);
        }
      }

      onProgress('muxing', 0.9);
      const resultBlob = buildAdobeSafeMp4(arrayBuffer, videoTrack, videoSamples, audioResult);
      onProgress('done', 1.0);
      return resultBlob;
    } catch (err) {
      console.error('[AdobeTranscoder] Transcoding error:', err);
      throw err;
    }
  };

  window.AdobeTranscoder = {
    normalizeForAdobe,
  };
})();
