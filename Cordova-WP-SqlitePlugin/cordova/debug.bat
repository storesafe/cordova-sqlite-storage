
@echo off
goto start


Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.

:start


if /i "%1"=="help" goto usage
if /i "%1"=="-help" goto usage
if /i "%1"=="--help" goto usage
if /i "%1"=="/help" goto usage
if /i "%1"=="/?" goto usage


if defined VCINSTALLDIR goto start-msbuild
if not defined VS100COMNTOOLS goto msbuild-missing
if not exist "%VS100COMNTOOLS%\..\..\vc\vcvarsall.bat" goto msbuild-missing
call "%VS100COMNTOOLS%\..\..\vc\vcvarsall.bat"
if not defined VCINSTALLDIR goto msbuild-missing
goto start-msbuild


:builderror
echo Error level 1
goto exit

:msbuild-missing
echo Error! Cannot run msbuild from this command prompt.  Try running a VS Command prompt.
goto exit


:start-msbuild
cd ..
msbuild /clp:NoSummary;NoItemAndPropertyList;Verbosity=minimal /nologo /p:Configuration=Debug
cd cordova
if errorlevel 1 goto builderror
goto deploy

:usage
echo "Usage: %0"
echo "solution file is expected to be in the parent folder."
goto exit

:deploy
CordovaDeploy ../Bin/Debug -d:1


:exit


